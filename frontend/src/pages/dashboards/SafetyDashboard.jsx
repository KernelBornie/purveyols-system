import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SafetyDashboard = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().substring(0, 10);

  const [form, setForm] = useState({
    site: '',
    incidentType: 'hazard',
    description: '',
    date: today,
    actionTaken: '',
    severity: 'medium',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [reportsRes, fundingRes, materialRes] = await Promise.all([
        API.get('/safety-reports'),
        API.get('/funding-requests'),
        API.get('/material-requests'),
      ]);
      setReports(reportsRes.data.reports || []);
      setFundingRequests(fundingRes.data.requests || []);
      setMaterialRequests(materialRes.data.requests || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/safety-reports', form);
      setMsg('Safety report submitted and sent to engineers');
      setShowForm(false);
      fetchAll();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || JSON.stringify(err.response?.data?.errors)));
    }
  };

  if (loading) return <div className="loading">Loading Safety Dashboard...</div>;

  const open = reports.filter((r) => r.status === 'open').length;
  const critical = reports.filter((r) => r.severity === 'critical').length;

  return (
    <div>
      <div className="page-header">
        <h1>⚠️ Safety Officer Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Open Reports', value: open, icon: '⚠️', color: '#e65100' },
          { label: 'Critical Cases', value: critical, icon: '🚨', color: '#b71c1c' },
          { label: 'Total Reports', value: reports.length, icon: '📋', color: '#1565c0' },
          { label: 'Material Requests', value: materialRequests.length, icon: '🔧', color: '#6a1b9a' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <button
          className="card"
          style={{ border: 'none', cursor: 'pointer', color: '#b71c1c', textAlign: 'center', padding: '14px', background: '#fff' }}
          onClick={() => setShowForm(!showForm)}
        >
          <div style={{ fontSize: '1.8rem' }}>⚠️</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Report Incident</div>
        </button>
        <Link to="/procurement/new" className="card" style={{ textDecoration: 'none', color: '#6a1b9a', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>🔧</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Request Materials</div>
        </Link>
      </div>

      {/* Safety Report Form */}
      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>⚠️ New Safety Report</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Site *</label>
                <input name="site" className="form-control" value={form.site} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" className="form-control" value={form.date} onChange={handleFormChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Incident Type *</label>
                <select name="incidentType" className="form-control" value={form.incidentType} onChange={handleFormChange}>
                  <option value="near-miss">Near Miss</option>
                  <option value="minor-injury">Minor Injury</option>
                  <option value="major-injury">Major Injury</option>
                  <option value="fatality">Fatality</option>
                  <option value="property-damage">Property Damage</option>
                  <option value="hazard">Hazard</option>
                </select>
              </div>
              <div className="form-group">
                <label>Severity</label>
                <select name="severity" className="form-control" value={form.severity} onChange={handleFormChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label>Action Taken</label>
              <textarea name="actionTaken" className="form-control" rows={2} value={form.actionTaken} onChange={handleFormChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Report</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Safety Reports History */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>📋 My Safety Reports</h3>
        {reports.length === 0 ? (
          <div className="empty-state">No safety reports yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Action Taken</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.site}</td>
                    <td>{r.incidentType}</td>
                    <td>
                      <span className={`badge badge-${r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'active'}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description}>
                      {r.description}
                    </td>
                    <td>{r.actionTaken || '—'}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🔧 My Material Requests</h3>
          <Link to="/procurement/new" className="btn btn-primary btn-sm">+ New</Link>
        </div>
        {materialRequests.length === 0 ? (
          <div className="empty-state">No material requests yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Site</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.itemName}</td>
                    <td>{req.quantity} {req.unit}</td>
                    <td>{req.site}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyDashboard;
