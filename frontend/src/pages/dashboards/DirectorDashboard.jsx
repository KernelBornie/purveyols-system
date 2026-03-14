import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const DirectorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, workersRes, fundingRes] = await Promise.all([
          API.get('/reports/summary'),
          API.get('/workers'),
          API.get('/funding-requests?status=pending'),
        ]);
        setSummary(summaryRes.data);
        setWorkers(workersRes.data.workers || []);
        setFundingRequests(fundingRes.data.requests || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await API.put(`/funding-requests/${id}/approve`);
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await API.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <div className="loading">Loading Director Dashboard...</div>;

  const totalPaid = workers.reduce((sum, w) => sum + (w.totalPaid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>📊 Director Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total General Workers', value: workers.length, icon: '👷', color: '#1565c0' },
          { label: 'Total Paid (ZMW)', value: `K${(summary?.payments?.totalAmount || 0).toLocaleString()}`, icon: '💰', color: '#2e7d32' },
          { label: 'Pending Approvals', value: fundingRequests.length, icon: '📋', color: '#e65100' },
          { label: 'Active Sites', value: [...new Set(workers.map((w) => w.site))].length, icon: '🏗️', color: '#6a1b9a' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '👷', label: 'Workers', to: '/workers' },
          { icon: '📋', label: 'Funding Requests', to: '/funding-requests' },
          { icon: '💳', label: 'Payments', to: '/payments' },
          { icon: '🏗️', label: 'Projects', to: '/projects' },
          { icon: '🚛', label: 'Logbooks', to: '/logbooks' },
          { icon: '📊', label: 'Reports', to: '/reports' },
        ].map(({ icon, label, to }) => (
          <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color: '#333', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Pending Funding Approvals */}
      {fundingRequests.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>📋 Funding Requests Pending Director</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Amount (ZMW)</th>
                  <th>Site</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fundingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td>{req.requestedBy?.name}</td>
                    <td>{req.requestedBy?.role}</td>
                    <td>{req.title}</td>
                    <td>K{req.amount?.toLocaleString()}</td>
                    <td>{req.site || '—'}</td>
                    <td>{req.description}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(req._id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(req._id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* General Workers List */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>👷 General Workers List</h3>
        {workers.length === 0 ? (
          <div className="empty-state">No workers enrolled yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NRC</th>
                  <th>Phone</th>
                  <th>Site</th>
                  <th>Daily Rate (ZMW)</th>
                  <th>Enrolled By</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td>
                    <td>{w.nrc}</td>
                    <td>{w.phone}</td>
                    <td>{w.site}</td>
                    <td>K{w.dailyRate}</td>
                    <td>{w.enrolledBy?.name} ({w.enrolledBy?.role})</td>
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

export default DirectorDashboard;
