import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const WorkerForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '', nrc: '', phone: '', dailyRate: '', site: '', mobileNetwork: 'airtel', enrollmentDate: today
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/workers', { ...form, dailyRate: Number(form.dailyRate) });
      navigate('/workers');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to enroll worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>👷 Enroll New General Worker</h1>
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
            <div className="form-group">
              <label>Daily Rate (ZMW) *</label>
              <input type="number" name="dailyRate" className="form-control" value={form.dailyRate} onChange={handleChange} required min="0" placeholder="e.g. 150" />
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
              {loading ? 'Enrolling...' : 'Enroll Worker'}
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
