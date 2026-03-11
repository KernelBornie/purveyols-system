import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const FundingRequestForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', amount: '', project: '' });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.project) delete payload.project;
      await API.post('/funding-requests', payload);
      navigate('/funding-requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>New Funding Request</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" className="form-control" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" className="form-control" rows={4} value={form.description} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (UGX) *</label>
              <input type="number" name="amount" className="form-control" value={form.amount} onChange={handleChange} required min="1" />
            </div>
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleChange}>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/funding-requests')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundingRequestForm;
