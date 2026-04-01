import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const PaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    paymentType: 'mobile_money', recipientName: '', recipientPhone: '',
    amount: '', currency: 'ZMW', description: '', project: '', status: 'pending',
    mobileNetwork: 'airtel'
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/payments/${id}`)
        .then(r => {
          const p = r.data;
          setForm({
            paymentType: p.paymentType || 'mobile_money',
            recipientName: p.recipientName || '',
            recipientPhone: p.recipientPhone || '',
            amount: p.amount ?? '',
            currency: p.currency || 'ZMW',
            description: p.description || '',
            project: p.project?._id || '',
            status: p.status || 'pending',
            mobileNetwork: p.mobileNetwork || 'airtel'
          });
        })
        .catch(() => setError('Failed to load payment'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.project) delete payload.project;
      if (isEdit) {
        await API.put(`/payments/${id}`, payload);
      } else {
        await API.post('/payments', payload);
      }
      navigate('/payments');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Payment' : 'New Payment'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Payment Type *</label>
              <select name="paymentType" className="form-control" value={form.paymentType} onChange={handleChange} required>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          {form.paymentType === 'mobile_money' && (
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Network *</label>
                <select name="mobileNetwork" className="form-control" value={form.mobileNetwork} onChange={handleChange} required>
                  <option value="airtel">Airtel Money</option>
                  <option value="mtn">MTN Mobile Money</option>
                </select>
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Recipient Name *</label>
              <input name="recipientName" className="form-control" value={form.recipientName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Recipient Phone</label>
              <input name="recipientPhone" className="form-control" value={form.recipientPhone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input type="number" name="amount" className="form-control" value={form.amount} onChange={handleChange} required min="1" />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input name="currency" className="form-control" value={form.currency} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleChange}>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Payment' : 'Create Payment'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/payments')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
