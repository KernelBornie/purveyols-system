import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AccountantDashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [searchNrc, setSearchNrc] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [payingAll, setPayingAll] = useState(false);
  const [bulkDays, setBulkDays] = useState(1);
  const [bulkNetwork, setBulkNetwork] = useState('airtel');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [workersRes, paymentsRes, fundingRes] = await Promise.all([
        API.get('/workers'),
        API.get('/payments'),
        API.get('/funding-requests?status=pending'),
      ]);
      setWorkers(workersRes.data.workers || []);
      setPayments(paymentsRes.data || []);
      setFundingRequests(fundingRes.data.requests || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    try {
      const res = await API.get(`/workers/search?nrc=${encodeURIComponent(searchNrc)}`);
      const workerPayments = payments.filter((p) => p.worker?._id === res.data.worker._id);
      const daysWorked = workerPayments.reduce((sum, p) => sum + (p.days || 0), 0);
      const totalPaid = workerPayments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);
      setSearchResult({ ...res.data.worker, daysWorked, totalPaid });
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Worker not found');
    }
  };

  const handlePayOne = async (workerId, days, network) => {
    try {
      const res = await API.post('/payments', {
        workerId,
        days: parseInt(days),
        mobileNetwork: network,
      });
      setMsg(`Payment ${res.data.payment.status}: ${res.data.message}`);
      fetchAll();
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handlePayAll = async () => {
    if (!window.confirm(`Pay ALL ${workers.length} active workers for ${bulkDays} day(s) via ${bulkNetwork.toUpperCase()}?`)) return;
    setPayingAll(true);
    try {
      const res = await API.post('/payments/bulk', {
        days: parseInt(bulkDays),
        mobileNetwork: bulkNetwork,
      });
      setMsg(res.data.message);
      fetchAll();
    } catch (err) {
      alert('Bulk payment failed: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setPayingAll(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/funding-requests/${id}/approve`);
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
      setMsg('Request approved');
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await API.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleForwardToDirector = async (req) => {
    try {
      await API.post('/funding-requests', {
        title: req.title,
        description: `[Forwarded from ${req.requestedBy?.name}] ${req.description}`,
        amount: req.amount,
        site: req.site,
        priority: req.priority,
      });
      setMsg('Request forwarded to Director');
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <div className="loading">Loading Accountant Dashboard...</div>;

  const totalPaidAll = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPay = workers.reduce((sum, w) => {
    const paid = payments
      .filter((p) => p.worker?._id === w._id && p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, w.dailyRate - paid);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <h1>💼 Accountant Dashboard</h1>
        <span style={{ color: '#666' }}>Accountant: {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Workers', value: workers.length, icon: '👷', color: '#1565c0' },
          { label: 'Total Paid (ZMW)', value: `K${totalPaidAll.toLocaleString()}`, icon: '💰', color: '#2e7d32' },
          { label: 'Pending Approvals', value: fundingRequests.length, icon: '📋', color: '#e65100' },
          { label: 'Total Payments', value: payments.length, icon: '💳', color: '#6a1b9a' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search Worker */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>🔍 Search Worker by NRC</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            className="form-control"
            placeholder="Enter NRC"
            value={searchNrc}
            onChange={(e) => setSearchNrc(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        {searchError && <div className="alert alert-error">{searchError}</div>}
        {searchResult && (
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginTop: '8px' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '8px' }}>{searchResult.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              <div><span style={{ color: '#666' }}>NRC:</span> {searchResult.nrc}</div>
              <div><span style={{ color: '#666' }}>Phone:</span> {searchResult.phone}</div>
              <div><span style={{ color: '#666' }}>Site:</span> {searchResult.site}</div>
              <div><span style={{ color: '#666' }}>Daily Rate:</span> K{searchResult.dailyRate}</div>
              <div><span style={{ color: '#666' }}>Enrolled By:</span> {searchResult.enrolledBy?.name} ({searchResult.enrolledBy?.role})</div>
              <div><span style={{ color: '#666' }}>Days Worked:</span> {searchResult.daysWorked}</div>
              <div><span style={{ color: '#2e7d32', fontWeight: '700' }}>Total Paid:</span> K{searchResult.totalPaid?.toLocaleString()}</div>
              <div><span style={{ color: '#e65100', fontWeight: '700' }}>Pending:</span> K{Math.max(0, searchResult.dailyRate - searchResult.totalPaid)}</div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                defaultValue="airtel"
                id={`net-${searchResult._id}`}
                style={{ maxWidth: '120px' }}
              >
                <option value="airtel">Airtel</option>
                <option value="mtn">MTN</option>
              </select>
              <input
                type="number"
                className="form-control"
                defaultValue={1}
                min={1}
                id={`days-${searchResult._id}`}
                style={{ maxWidth: '80px' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  const net = document.getElementById(`net-${searchResult._id}`)?.value || 'airtel';
                  const d = document.getElementById(`days-${searchResult._id}`)?.value || 1;
                  handlePayOne(searchResult._id, d, net);
                }}
              >
                Pay Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* General Workers Payments */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3>👷 General Workers Payments</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="form-control" value={bulkNetwork} onChange={(e) => setBulkNetwork(e.target.value)} style={{ width: '120px' }}>
              <option value="airtel">Airtel</option>
              <option value="mtn">MTN</option>
            </select>
            <input
              type="number"
              className="form-control"
              value={bulkDays}
              min={1}
              onChange={(e) => setBulkDays(e.target.value)}
              style={{ width: '80px' }}
              title="Days"
            />
            <button className="btn btn-primary" onClick={handlePayAll} disabled={payingAll || workers.length === 0}>
              {payingAll ? 'Processing...' : `Pay ALL Workers (${bulkDays} day${bulkDays > 1 ? 's' : ''})`}
            </button>
          </div>
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
                  <th>Days</th>
                  <th>Paid (ZMW)</th>
                  <th>Pending</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const workerPayments = payments.filter((p) => p.worker?._id === w._id);
                  const daysWorked = workerPayments.reduce((sum, p) => sum + (p.days || 0), 0);
                  const paid = workerPayments
                    .filter((p) => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0);
                  return (
                    <tr key={w._id}>
                      <td>{w.name}</td>
                      <td>{w.nrc}</td>
                      <td>{w.phone}</td>
                      <td>K{w.dailyRate}</td>
                      <td>{w.site}</td>
                      <td>{w.enrolledBy?.name} ({w.enrolledBy?.role})</td>
                      <td>{daysWorked}</td>
                      <td style={{ color: '#2e7d32', fontWeight: '600' }}>K{paid.toLocaleString()}</td>
                      <td style={{ color: '#e65100', fontWeight: '600' }}>K{Math.max(0, w.dailyRate - paid)}</td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePayOne(w._id, 1, w.mobileNetwork || 'airtel')}
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Funding Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>📋 Funding Requests (Pending Accountant)</h3>
          <Link to="/funding-requests/new" className="btn btn-primary btn-sm">+ New Request</Link>
        </div>
        {fundingRequests.length === 0 ? (
          <div className="empty-state">No pending funding requests.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Amount</th>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => handleForwardToDirector(req)}>Forward</button>
                      </div>
                    </td>
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

export default AccountantDashboard;
