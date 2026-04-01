import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEdit = Boolean(id);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '', nrc: '', phone: '', dailyRate: '', overtimeRate: '', site: '', mobileNetwork: 'airtel', enrollmentDate: today
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      API.get(`/workers/${id}`)
        .then(r => {
          const w = r.data;
          setForm({
            name: w.name || '',
            nrc: w.nrc || '',
            phone: w.phone || '',
            dailyRate: w.dailyRate ?? '',
            overtimeRate: w.overtimeRate ?? '',
            site: w.site || '',
            mobileNetwork: w.mobileNetwork || 'airtel',
            enrollmentDate: w.enrolledAt ? w.enrolledAt.substring(0, 10) : today
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
      const payload = {
        ...form,
        dailyRate: Number(form.dailyRate),
        overtimeRate: form.overtimeRate !== '' ? Number(form.overtimeRate) : 0,
      };
      if (isEdit) {
        await API.put(`/workers/${id}`, payload);
      } else {
        await API.post('/workers', payload);
      }
      navigate('/workers');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save worker');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>👷 {isEdit ? 'Edit Worker' : 'Enroll New General Worker'}</h1>
        <span style={{ color: '#666' }}>Enrolling as: {user?.name} ({user?.role})</span>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required placeholder="e.g. John Banda" />
            </div>
            <div className="form-group">
              <label>NRC (National Registration Card) *</label>
              <input name="nrc" className="form-control" value={form.nrc} onChange={handleChange} required placeholder="e.g. 123456/78/1" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input name="phone" className="form-control" value={form.phone} onChange={handleChange} required placeholder="e.g. 0971234567" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Daily Rate (ZMW) *</label>
              <input type="number" name="dailyRate" className="form-control" value={form.dailyRate} onChange={handleChange} required min="0" placeholder="e.g. 150" />
            </div>
            <div className="form-group">
              <label>Overtime Rate (ZMW/hr)</label>
              <input type="number" name="overtimeRate" className="form-control" value={form.overtimeRate} onChange={handleChange} min="0" placeholder="e.g. 25" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Site Name *</label>
              <input name="site" className="form-control" value={form.site} onChange={handleChange} required placeholder="e.g. Chipata Mall, UTH, ABSA" />
            </div>
            <div className="form-group">
              <label>Mobile Money Network</label>
              <select name="mobileNetwork" className="form-control" value={form.mobileNetwork} onChange={handleChange}>
                <option value="airtel">Airtel Money</option>
                <option value="mtn">MTN Money</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Enrollment Date *</label>
              <input type="date" name="enrollmentDate" className="form-control" value={form.enrollmentDate} onChange={handleChange} required />
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
