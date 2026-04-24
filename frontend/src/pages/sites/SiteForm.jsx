import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SiteForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    projectName: '',
    description: '',
    terrain: 'flat',
    accessibility: 'urban',
    siteType: 'residential',
    area: '',
    areaUnit: 'm²',
    status: 'planned',
  });
  const [gpsStatus, setGpsStatus] = useState('');
  const [capturedGPS, setCapturedGPS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGPS = () => {
    if (!navigator.geolocation) { setGpsStatus('❌ Geolocation not supported'); return; }
    setGpsStatus('📡 Acquiring GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, altitude, accuracy } = pos.coords;
        setCapturedGPS({ lat: latitude, lng: longitude, altitude, accuracy });
        setGpsStatus(`✅ GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
      },
      (err) => setGpsStatus(`❌ ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, area: form.area ? Number(form.area) : 0 };
      if (capturedGPS) {
        payload.primaryCoordinate = { lat: capturedGPS.lat, lng: capturedGPS.lng };
        payload.coordinates = [{ lat: capturedGPS.lat, lng: capturedGPS.lng, altitude: capturedGPS.altitude, accuracy: capturedGPS.accuracy, capturedBy: user?._id }];
      }
      await API.post('/sites', payload);
      navigate('/sites');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📍 New Site</h1>
      </div>
      <div className="card" style={{ maxWidth: '600px' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Site Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="form-control" placeholder="e.g. Lusaka Road Widening – Phase 1" />
          </div>
          <div className="form-group">
            <label>Project Name</label>
            <input name="projectName" value={form.projectName} onChange={handleChange} className="form-control" placeholder="Associated project name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Site Type</label>
              <select name="siteType" value={form.siteType} onChange={handleChange} className="form-control">
                {['residential', 'commercial', 'industrial', 'infrastructure', 'road', 'bridge', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Terrain</label>
              <select name="terrain" value={form.terrain} onChange={handleChange} className="form-control">
                {['flat', 'sloped', 'hilly', 'mountainous'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Accessibility</label>
              <select name="accessibility" value={form.accessibility} onChange={handleChange} className="form-control">
                {['urban', 'suburban', 'rural', 'remote'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-control">
                {['planned', 'active', 'surveyed', 'completed'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Area</label>
              <input name="area" type="number" value={form.area} onChange={handleChange} className="form-control" placeholder="e.g. 500" />
            </div>
            <div className="form-group">
              <label>Area Unit</label>
              <select name="areaUnit" value={form.areaUnit} onChange={handleChange} className="form-control">
                {['m²', 'ha', 'km²', 'acres'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>GPS Coordinates</label>
            <button type="button" onClick={handleGPS} className="btn btn-secondary" style={{ marginBottom: '8px' }}>
              📡 Capture Current GPS
            </button>
            {gpsStatus && (
              <div style={{ fontSize: '0.82rem', color: gpsStatus.startsWith('✅') ? '#2e7d32' : gpsStatus.startsWith('📡') ? '#f57c00' : '#c62828', padding: '6px 0' }}>
                {gpsStatus}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Create Site'}
            </button>
            <button type="button" onClick={() => navigate('/sites')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteForm;
