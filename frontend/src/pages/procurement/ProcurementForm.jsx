import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    itemName: '', description: '', quantity: '', unitPrice: '',
    project: '', supplier: '', deliveryDate: ''
  });
  const [projects, setProjects] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/procurement/${id}`)
        .then(r => {
          const o = r.data;
          setForm({
            itemName: o.itemName || '',
            description: o.description || '',
            quantity: o.quantity ?? '',
            unitPrice: o.unitPrice ?? '',
            project: o.project?._id || '',
            supplier: o.supplier || '',
            deliveryDate: o.deliveryDate ? o.deliveryDate.substring(0, 10) : ''
          });
          setTotalPrice(o.totalPrice || 0);
        })
        .catch(() => setError('Failed to load order'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = e => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    const qty = parseFloat(updated.quantity) || 0;
    const price = parseFloat(updated.unitPrice) || 0;
    setTotalPrice(qty * price);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.project) delete payload.project;
      if (!payload.deliveryDate) delete payload.deliveryDate;
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
          <div className="form-row">
            <div className="form-group">
              <label>Item Name *</label>
              <input name="itemName" className="form-control" value={form.itemName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Supplier</label>
              <input name="supplier" className="form-control" value={form.supplier} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" rows={2} value={form.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" name="quantity" className="form-control" value={form.quantity} onChange={handleChange} required min="1" />
            </div>
            <div className="form-group">
              <label>Unit Price (UGX) *</label>
              <input type="number" name="unitPrice" className="form-control" value={form.unitPrice} onChange={handleChange} required min="0" />
            </div>
          </div>
          <div className="form-group">
            <label>Total Price (UGX)</label>
            <input className="form-control" value={totalPrice.toLocaleString()} readOnly style={{ backgroundColor: '#f8f9fa' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleChange}>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Delivery Date</label>
              <input type="date" name="deliveryDate" className="form-control" value={form.deliveryDate} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Submit Order'}
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
