import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', nationalId: '', phone: '', role: 'worker', project: '', status: 'active'
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/workers/${id}`)
        .then(r => {
          const w = r.data;
          setForm({
            name: w.name || '',
            nationalId: w.nationalId || '',
            phone: w.phone || '',
            role: w.role || 'worker',
            project: w.project?._id || '',
            status: w.status || 'active'
          });
        })
        .catch(() => setError('Failed to load worker'))
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
        await API.put(`/workers/${id}`, payload);
      } else {
        await API.post('/workers', payload);
      }
      navigate('/workers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save worker');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Worker' : 'Enroll New Worker'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>National ID *</label>
              <input name="nationalId" className="form-control" value={form.nationalId} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="worker">Worker</option>
                <option value="driver">Driver</option>
                <option value="foreman">Foreman</option>
                <option value="engineer">Engineer</option>
                <option value="other">Other</option>
              </select>
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
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Worker' : 'Enroll Worker'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/workers')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerForm;
