import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const emptyItem = () => ({ name: '', quantity: '', description: '', unitPrice: '' });
const calculateItemTotal = (quantity, unitPrice) =>
  quantity && unitPrice ? Number(quantity) * Number(unitPrice) : null;
const CURRENCY_SYMBOL = 'K';
const GRAND_TOTAL_LABEL_COLSPAN = 5;

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEdit = Boolean(id);
  const canSetPrice = user?.role === 'procurement';
  const canViewPrice = user?.role !== 'engineer';

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
          const fetchedItems = (o.items || []).map(item => ({
            name: item.name || '',
            quantity: item.quantity ?? '',
            description: item.description || '',
            unitPrice: item.unitPrice ?? ''
          }));
          setItems(
            fetchedItems.length ? fetchedItems : [emptyItem()]
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
  const grandTotal = items.reduce(
    (sum, item) => sum + (calculateItemTotal(item.quantity, item.unitPrice) || 0),
    0
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const normalizedItems = items.map(item => ({
      name: item.name.trim(),
      quantity: item.quantity,
      description: item.description.trim(),
      unitPrice: item.unitPrice
    }));
    const populatedItems = normalizedItems.filter(item =>
      item.name || item.quantity !== '' || item.description || item.unitPrice !== ''
    );

    if (populatedItems.length === 0) {
      setError('At least one item is required');
      return;
    }

    for (const item of populatedItems) {
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
        items: populatedItems.map(item => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          description: item.description || undefined,
          ...(canSetPrice && item.unitPrice !== ''
            ? { unitPrice: Number(item.unitPrice) }
            : {})
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
          <div className="table-wrapper" style={{ marginBottom: '12px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name *</th>
                  <th>Quantity *</th>
                  <th>Description</th>
                  {canViewPrice && <th>Unit Price (ZMW)</th>}
                  {canViewPrice && <th>Total Price (ZMW)</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const totalPrice = calculateItemTotal(item.quantity, item.unitPrice);
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          name="name"
                          aria-label={`Item Name ${index + 1}`}
                          className="form-control"
                          value={item.name}
                          onChange={e => handleItemChange(index, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="quantity"
                          aria-label={`Quantity ${index + 1}`}
                          className="form-control"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, e)}
                          min="1"
                        />
                      </td>
                      <td>
                        <textarea
                          name="description"
                          aria-label={`Description ${index + 1}`}
                          className="form-control"
                          rows={2}
                          value={item.description}
                          onChange={e => handleItemChange(index, e)}
                        />
                      </td>
                      {canViewPrice && (
                        <td>
                          <input
                            type="number"
                            name="unitPrice"
                            aria-label={`Unit Price ${index + 1}`}
                            className="form-control"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(index, e)}
                            min="0.01"
                            step="0.01"
                            disabled={!canSetPrice}
                          />
                        </td>
                      )}
                      {canViewPrice && <td>{totalPrice != null ? `${CURRENCY_SYMBOL}${totalPrice.toLocaleString()}` : '—'}</td>}
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>
                            Remove Item
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {canViewPrice && (
                <tfoot>
                  <tr>
                    <td colSpan={GRAND_TOTAL_LABEL_COLSPAN} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total:</td>
                    <td style={{ fontWeight: 700, color: '#1565c0' }}>
                      {CURRENCY_SYMBOL}
                      {grandTotal.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <button type="button" className="btn btn-secondary" style={{ marginBottom: '16px' }} onClick={addItem}>
            Add Item
          </button>

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
