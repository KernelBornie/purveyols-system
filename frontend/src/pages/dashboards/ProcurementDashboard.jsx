import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ProcurementDashboard = () => {
  const { user } = useContext(AuthContext);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [materialRes, fundingRes, workersRes] = await Promise.all([
        API.get('/material-requests'),
        API.get('/funding-requests'),
        API.get('/workers'),
      ]);
      setMaterialRequests(materialRes.data.requests || []);
      setFundingRequests(fundingRes.data.requests || []);
      setWorkers(workersRes.data.workers || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaterial = async (id, status) => {
    try {
      await API.put(`/material-requests/${id}/status`, { status });
      setMsg(`Request ${status}`);
      fetchAll();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <div className="loading">Loading Procurement Dashboard...</div>;

  const pending = materialRequests.filter((r) => r.status === 'pending').length;
  const ordered = materialRequests.filter((r) => r.status === 'ordered').length;

  return (
    <div>
      <div className="page-header">
        <h1>🛒 Procurement Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Pending Requests', value: pending, icon: '⏳', color: '#e65100' },
          { label: 'Ordered', value: ordered, icon: '📦', color: '#1565c0' },
          { label: 'Total Workers', value: workers.length, icon: '👷', color: '#2e7d32' },
          { label: 'All Requests', value: materialRequests.length, icon: '📋', color: '#6a1b9a' },
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
          { icon: '💰', label: 'Request Funding', to: '/funding-requests/new', color: '#e65100' },
          { icon: '📋', label: 'New Material Request', to: '/procurement/new', color: '#1565c0' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color, textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Material Requests from all staff */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>📦 Pending Material Requests</h3>
        {materialRequests.filter((r) => r.status === 'pending').length === 0 ? (
          <div className="empty-state">No pending requests.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>Role</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Site</th>
                  <th>Urgency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests
                  .filter((r) => r.status === 'pending')
                  .map((req) => (
                    <tr key={req._id}>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>{req.requestedBy?.name}</td>
                      <td>{req.requestedBy?.role}</td>
                      <td>{req.itemName}</td>
                      <td>{req.quantity}</td>
                      <td>{req.unit}</td>
                      <td>{req.site}</td>
                      <td><span className={`badge badge-${req.urgency}`}>{req.urgency}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-success btn-sm" onClick={() => handleUpdateMaterial(req._id, 'ordered')}>
                            Approve & Order
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleUpdateMaterial(req._id, 'cancelled')}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Material Requests History */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>📋 All Material Requests</h3>
        {materialRequests.length === 0 ? (
          <div className="empty-state">No material requests yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
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
                    <td>{req.requestedBy?.name} ({req.requestedBy?.role})</td>
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

      {/* Funding requests (my own) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>💰 My Funding Requests</h3>
          <Link to="/funding-requests/new" className="btn btn-primary btn-sm">+ New</Link>
        </div>
        {fundingRequests.filter((r) => r.requestedBy?._id === user?._id).length === 0 ? (
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
                {fundingRequests
                  .filter((r) => r.requestedBy?._id === user?._id)
                  .map((req) => (
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
    </div>
  );
};

export default ProcurementDashboard;
