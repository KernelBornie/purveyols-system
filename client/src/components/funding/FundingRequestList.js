import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card, { LoadingSpinner, Badge, Button } from '../shared/UI';

const FundingRequestList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/funding-requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError('Failed to load funding requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const canApprove = user?.role === 'accountant' || user?.role === 'director';

  const handleApprove = async (id) => {
    const notes = window.prompt('Approval notes (optional):') || '';
    try {
      const res = await api.put(`/funding-requests/${id}/approve`, { approvalNotes: notes });
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data.request : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      const res = await api.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data.request : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const handleDisburse = async (id) => {
    if (!window.confirm('Confirm fund disbursement?')) return;
    try {
      const res = await api.put(`/funding-requests/${id}/disburse`);
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data.request : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  const canCreate = ['engineer', 'foreman', 'accountant'].includes(user?.role);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>📋 Funding Requests</h2>
        {canCreate && <Link to="/funding-requests/new"><Button variant="primary">+ New Request</Button></Link>}
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      <Card>
        {requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No funding requests found.</p>
        ) : (
          requests.map((req) => (
            <div key={req._id} style={{ padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>{req.title}</span>
                    <Badge status={req.status} />
                    <Badge status={req.priority} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    <strong>K{req.amount?.toLocaleString()}</strong> • {req.requestedBy?.name} ({req.requestedByRole}) • {req.site || 'No site'}
                  </div>
                  <div style={{ fontSize: '0.83rem', color: '#888', marginTop: '4px' }}>{req.description.substring(0, 150)}{req.description.length > 150 ? '...' : ''}</div>
                  {req.approvedBy && <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>Reviewed by: {req.approvedBy?.name} {req.approvalNotes && `— "${req.approvalNotes}"`}</div>}
                  {req.rejectionReason && <div style={{ fontSize: '0.82rem', color: '#c62828', marginTop: '4px' }}>Reason: {req.rejectionReason}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px' }}>{new Date(req.createdAt).toLocaleString()}</div>
                </div>
                {canApprove && req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleApprove(req._id)} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Approve</button>
                    <button onClick={() => handleReject(req._id)} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Reject</button>
                  </div>
                )}
                {user?.role === 'director' && req.status === 'approved' && (
                  <button onClick={() => handleDisburse(req._id)} style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Disburse</button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default FundingRequestList;
