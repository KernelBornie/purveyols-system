import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ForemanDashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, fundingRes, materialRes] = await Promise.all([
          API.get('/workers'),
          API.get('/funding-requests'),
          API.get('/material-requests'),
        ]);
        setWorkers((workersRes.data.workers || []).filter((w) => w.enrolledBy?._id === user?._id));
        setFundingRequests(fundingRes.data.requests || []);
        setMaterialRequests(materialRes.data.requests || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="loading">Loading Foreman Dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>🦺 Foreman Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'My Workers', value: workers.length, icon: '👷', color: '#1565c0' },
          { label: 'Funding Requests', value: fundingRequests.length, icon: '💰', color: '#e65100' },
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
        {[
          { icon: '👷', label: 'Enroll Worker', to: '/workers/new', color: '#1565c0' },
          { icon: '👥', label: 'View Workers', to: '/workers', color: '#1565c0' },
          { icon: '💰', label: 'Request Funding', to: '/funding-requests/new', color: '#e65100' },
          { icon: '🔧', label: 'Request Materials', to: '/procurement/new', color: '#6a1b9a' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color, textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* My Workers */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>👷 My Enrolled General Workers</h3>
          <Link to="/workers/new" className="btn btn-primary btn-sm">+ Enroll</Link>
        </div>
        {workers.length === 0 ? (
          <div className="empty-state">No workers enrolled yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>NRC</th>
                  <th>Phone</th>
                  <th>Daily Rate</th>
                  <th>Site</th>
                  <th>Enrolled By</th>
                  <th>Date Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td>
                    <td>{w.nrc}</td>
                    <td>{w.phone}</td>
                    <td>K{w.dailyRate}</td>
                    <td>{w.site}</td>
                    <td>{w.enrolledBy?.name} ({w.enrolledBy?.role})</td>
                    <td>{w.enrolledAt ? new Date(w.enrolledAt).toLocaleDateString() : w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Funding Requests */}
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

export default ForemanDashboard;
