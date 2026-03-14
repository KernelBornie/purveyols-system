import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const DriverDashboard = () => {
  const { user } = useContext(AuthContext);
  const [logbooks, setLogbooks] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);

  const today = new Date().toISOString().substring(0, 10);

  const [logForm, setLogForm] = useState({
    vehicleNumber: '',
    date: today,
    timeIn: '',
    timeOut: '',
    distanceKm: '',
    fuelLitres: '',
    route: '',
    purpose: '',
    site: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logbooksRes, fundingRes, materialRes] = await Promise.all([
          API.get('/logbooks'),
          API.get('/funding-requests'),
          API.get('/material-requests'),
        ]);
        setLogbooks(logbooksRes.data.entries || []);
        setFundingRequests(fundingRes.data.requests || []);
        setMaterialRequests(materialRes.data.requests || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calcMinutes = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return null;
    const [h1, m1] = timeIn.split(':').map(Number);
    const [h2, m2] = timeOut.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diff >= 0 ? diff : null;
  };

  const calcHours = (timeIn, timeOut) => {
    const diff = calcMinutes(timeIn, timeOut);
    if (diff === null) return '—';
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  };

  const STANDARD_WORK_MINUTES = 480; // 8 hours

  const handleLogChange = (e) => setLogForm({ ...logForm, [e.target.name]: e.target.value });

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/logbooks', { type: 'vehicle', ...logForm, distanceKm: Number(logForm.distanceKm), fuelLitres: Number(logForm.fuelLitres) });
      setMsg('Logbook entry saved and sent to accountant');
      setShowLogForm(false);
      const res = await API.get('/logbooks');
      setLogbooks(res.data.entries || []);
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || JSON.stringify(err.response?.data?.errors)));
    }
  };

  if (loading) return <div className="loading">Loading Driver Dashboard...</div>;

  const todayLogs = logbooks.filter((l) => new Date(l.date).toISOString().substring(0, 10) === today);
  const todayDistance = todayLogs.reduce((sum, l) => sum + (l.distanceKm || 0), 0);
  const todayFuel = todayLogs.reduce((sum, l) => sum + (l.fuelLitres || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>🚛 Driver Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* Today's Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: "Today's Distance", value: `${todayDistance} km`, icon: '🛣️', color: '#1565c0' },
          { label: "Today's Fuel", value: `${todayFuel} L`, icon: '⛽', color: '#e65100' },
          { label: 'Total Log Entries', value: logbooks.length, icon: '📋', color: '#2e7d32' },
          { label: 'Funding Requests', value: fundingRequests.length, icon: '💰', color: '#6a1b9a' },
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
          style={{ border: 'none', cursor: 'pointer', color: '#1565c0', textAlign: 'center', padding: '14px', background: '#fff' }}
          onClick={() => setShowLogForm(!showLogForm)}
        >
          <div style={{ fontSize: '1.8rem' }}>📋</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Submit Logbook</div>
        </button>
        <Link to="/funding-requests/new" className="card" style={{ textDecoration: 'none', color: '#e65100', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>💰</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Request Funding</div>
        </Link>
        <Link to="/procurement/new" className="card" style={{ textDecoration: 'none', color: '#6a1b9a', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>🔧</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Request Spare Parts</div>
        </Link>
      </div>

      {/* Logbook Form */}
      {showLogForm && (
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>📋 New Logbook Entry</h3>
          <form onSubmit={handleLogSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Number *</label>
                <input name="vehicleNumber" className="form-control" value={logForm.vehicleNumber} onChange={handleLogChange} required />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" className="form-control" value={logForm.date} onChange={handleLogChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Time In (Sign In) *</label>
                <input type="time" name="timeIn" className="form-control" value={logForm.timeIn} onChange={handleLogChange} required />
              </div>
              <div className="form-group">
                <label>Time Out (Knock Off) *</label>
                <input type="time" name="timeOut" className="form-control" value={logForm.timeOut} onChange={handleLogChange} required />
              </div>
            </div>
            {logForm.timeIn && logForm.timeOut && (
              <div style={{ marginBottom: '12px', color: '#2e7d32', fontWeight: '600' }}>
                ⏱️ Hours Worked: {calcHours(logForm.timeIn, logForm.timeOut)}
                {(() => {
                  const diff = calcMinutes(logForm.timeIn, logForm.timeOut);
                  const overtime = diff !== null && diff > STANDARD_WORK_MINUTES ? diff - STANDARD_WORK_MINUTES : 0;
                  return overtime > 0 ? <span style={{ color: '#e65100', marginLeft: '12px' }}>Overtime: {Math.floor(overtime / 60)}h {overtime % 60}m</span> : null;
                })()}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Distance (km) *</label>
                <input type="number" name="distanceKm" className="form-control" value={logForm.distanceKm} onChange={handleLogChange} required min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Fuel (Litres) *</label>
                <input type="number" name="fuelLitres" className="form-control" value={logForm.fuelLitres} onChange={handleLogChange} required min="0" step="0.1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Route *</label>
                <input name="route" className="form-control" value={logForm.route} onChange={handleLogChange} required />
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <input name="purpose" className="form-control" value={logForm.purpose} onChange={handleLogChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Site</label>
                <input name="site" className="form-control" value={logForm.site} onChange={handleLogChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input name="notes" className="form-control" value={logForm.notes} onChange={handleLogChange} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Logbook</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowLogForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Logbook History */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>📋 My Logbook Entries</h3>
        {logbooks.length === 0 ? (
          <div className="empty-state">No logbook entries yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Hours</th>
                  <th>Distance (km)</th>
                  <th>Fuel (L)</th>
                  <th>Route</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {logbooks.map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{entry.vehicleNumber}</td>
                    <td>{entry.timeIn}</td>
                    <td>{entry.timeOut}</td>
                    <td>{calcHours(entry.timeIn, entry.timeOut)}</td>
                    <td>{entry.distanceKm}</td>
                    <td>{entry.fuelLitres}</td>
                    <td>{entry.route}</td>
                    <td>{entry.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Funding Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>💰 My Funding Requests</h3>
          <Link to="/funding-requests/new" className="btn btn-primary btn-sm">+ New</Link>
        </div>
        {fundingRequests.length === 0 ? (
          <div className="empty-state">No funding requests yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Amount (ZMW)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fundingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.title}</td>
                    <td>K{req.amount?.toLocaleString()}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material / Spare Parts Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🔧 My Spare Parts Requests</h3>
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

export default DriverDashboard;
