import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', location: '',
    startDate: '', endDate: '', status: 'planning',
    budget: '', assignedEngineer: '', assignedForeman: ''
  });
  const [engineers, setEngineers] = useState([]);
  const [foremen, setForemen] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/users?role=engineer').then(r => {
      setEngineers(r.data);
    }).catch(() => {});
    API.get('/users?role=foreman').then(r => {
      setForemen(r.data);
    }).catch(() => {});

    if (isEdit) {
      API.get(`/projects/${id}`)
        .then(r => {
          const p = r.data;
          setForm({
            name: p.name || '',
            description: p.description || '',
            location: p.location || '',
            startDate: p.startDate ? p.startDate.substring(0, 10) : '',
            endDate: p.endDate ? p.endDate.substring(0, 10) : '',
            status: p.status || 'planning',
            budget: p.budget ?? '',
            assignedEngineer: p.assignedEngineer?._id || '',
            assignedForeman: p.assignedForeman?._id || ''
          });
        })
        .catch(() => setError('Failed to load project'))
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
      if (!payload.assignedEngineer) delete payload.assignedEngineer;
      if (!payload.assignedForeman) delete payload.assignedForeman;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      if (!payload.budget) delete payload.budget;

      if (isEdit) {
        await API.put(`/projects/${id}`, payload);
      } else {
        await API.post('/projects', payload);
      }
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Project' : 'New Project'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" className="form-control" value={form.location} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="startDate" className="form-control" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="endDate" className="form-control" value={form.endDate} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Budget (UGX)</label>
              <input type="number" name="budget" className="form-control" value={form.budget} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assigned Engineer</label>
              <select name="assignedEngineer" className="form-control" value={form.assignedEngineer} onChange={handleChange}>
                <option value="">— Select Engineer —</option>
                {engineers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assigned Foreman</label>
              <select name="assignedForeman" className="form-control" value={form.assignedForeman} onChange={handleChange}>
                <option value="">— Select Foreman —</option>
                {foremen.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/projects')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
