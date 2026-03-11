import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const LogbookForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    type: 'work', project: '', date: new Date().toISOString().substring(0, 10),
    description: '', hoursWorked: '', distanceTravelled: '', fuelUsed: '',
    vehicleNumber: '', startLocation: '', endLocation: ''
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/logbooks/${id}`)
        .then(r => {
          const l = r.data;
          setForm({
            type: l.type || 'work',
            project: l.project?._id || '',
            date: l.date ? l.date.substring(0, 10) : '',
            description: l.description || '',
            hoursWorked: l.hoursWorked ?? '',
            distanceTravelled: l.distanceTravelled ?? '',
            fuelUsed: l.fuelUsed ?? '',
            vehicleNumber: l.vehicleNumber || '',
            startLocation: l.startLocation || '',
            endLocation: l.endLocation || ''
          });
        })
        .catch(() => setError('Failed to load logbook entry'))
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
      if (payload.type === 'work') {
        delete payload.distanceTravelled; delete payload.fuelUsed;
        delete payload.vehicleNumber; delete payload.startLocation; delete payload.endLocation;
      } else {
        delete payload.hoursWorked;
      }
      Object.keys(payload).forEach(k => payload[k] === '' && delete payload[k]);

      if (isEdit) {
        await API.put(`/logbooks/${id}`, payload);
      } else {
        await API.post('/logbooks', payload);
      }
      navigate('/logbooks');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save logbook entry');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Logbook Entry' : 'New Logbook Entry'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                <option value="work">Work Log</option>
                <option value="vehicle">Vehicle Log</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" className="form-control" value={form.date} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Project</label>
            <select name="project" className="form-control" value={form.project} onChange={handleChange}>
              <option value="">— Select Project —</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          {form.type === 'work' && (
            <div className="form-group">
              <label>Hours Worked</label>
              <input type="number" name="hoursWorked" className="form-control" value={form.hoursWorked} onChange={handleChange} min="0" step="0.5" />
            </div>
          )}

          {form.type === 'vehicle' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input name="vehicleNumber" className="form-control" value={form.vehicleNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Distance Travelled (km)</label>
                  <input type="number" name="distanceTravelled" className="form-control" value={form.distanceTravelled} onChange={handleChange} min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fuel Used (litres)</label>
                  <input type="number" name="fuelUsed" className="form-control" value={form.fuelUsed} onChange={handleChange} min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Location</label>
                  <input name="startLocation" className="form-control" value={form.startLocation} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>End Location</label>
                  <input name="endLocation" className="form-control" value={form.endLocation} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Add Entry'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/logbooks')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogbookForm;
