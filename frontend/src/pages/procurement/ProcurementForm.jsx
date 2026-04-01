import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const emptyItem = () => ({ name: '', quantity: '', description: '' });

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEdit = Boolean(id);

  const [items, setItems] = useState([emptyItem()]);
  const [form, setForm] = useState({ project: '', deliveryDate: '' });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/procurement/${id}`)
        .then(r => {
          const o = r.data;
          setItems(
            (o.items || []).map(item => ({
              name: item.name || '',
              quantity: item.quantity ?? '',
              description: item.description || ''
            }))
          );
          setForm({
            project: o.project?._id || '',
            deliveryDate: o.deliveryDate ? o.deliveryDate.substring(0, 10) : ''
          });
        })
        .catch(() => setError('Failed to load order'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleItemChange = (index, e) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [e.target.name]: e.target.value } : item
    );
    setItems(updated);
  };

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    for (const item of items) {
      if (!item.name.trim()) {
        setError('Each item must have a name');
        return;
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        setError('Each item must have a quantity of at least 1');
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        items: items.map(item => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          description: item.description.trim() || undefined
        })),
        project: form.project || undefined,
        deliveryDate: form.deliveryDate || undefined
      };
      if (isEdit) {
        await API.put(`/procurement/${id}`, payload);
      } else {
        await API.post('/procurement', payload);
      }
      navigate('/procurement');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Procurement Order' : 'New Procurement Order'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '12px' }}>Items</h3>
          {items.map((item, index) => (
            <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong>Item {index + 1}</strong>
                {items.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    name="name"
                    className="form-control"
                    value={item.name}
                    onChange={e => handleItemChange(index, e)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    value={item.quantity}
                    onChange={e => handleItemChange(index, e)}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={2}
                  value={item.description}
                  onChange={e => handleItemChange(index, e)}
                />
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary" style={{ marginBottom: '16px' }} onClick={addItem}>
            + Add Item
          </button>

          {items.some(item => item.name.trim()) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>Items Summary</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(item => item.name.trim()).map((item, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleFormChange}>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Delivery Date</label>
              <input type="date" name="deliveryDate" className="form-control" value={form.deliveryDate} onChange={handleFormChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Submit Request'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/procurement')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcurementForm;
