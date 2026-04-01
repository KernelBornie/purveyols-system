import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const emptyItem = () => ({ name: '', quantity: '', cost: '' });

const MaterialListForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then((r) => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/material-list/${id}`)
        .then((r) => {
          const ml = r.data.materialList;
          setProjectId(ml.projectId?._id || '');
          setItems(
            ml.items?.length
              ? ml.items.map((it) => ({
                  name: it.name || '',
                  quantity: it.quantity ?? '',
                  cost: it.cost ?? '',
                }))
              : [emptyItem()]
          );
        })
        .catch(() => setError('Failed to load material list'))
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

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        projectId: projectId || undefined,
        items: items.map((it) => ({
          name: it.name,
          quantity: parseFloat(it.quantity),
          cost: parseFloat(it.cost),
        })),
      };
      if (isEdit) {
        await API.put(`/material-list/${id}`, payload);
      } else {
        await API.post('/material-list', payload);
      }
      navigate('/material-list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save material list');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Material List' : 'New Material List'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="projectId" className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Material Items */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Materials</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name *</th>
                    <th>Quantity *</th>
                    <th>Cost (ZMW) *</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input
                          name="name"
                          className="form-control"
                          value={item.name}
                          onChange={(e) => handleItemChange(i, e)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="quantity"
                          className="form-control"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(i, e)}
                          required
                          min="0"
                          step="0.01"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="cost"
                          className="form-control"
                          value={item.cost}
                          onChange={(e) => handleItemChange(i, e)}
                          required
                          min="0"
                          step="0.01"
                          style={{ width: '120px' }}
                        />
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeItem(i)}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Material List' : 'Create Material List'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/material-list')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialListForm;
