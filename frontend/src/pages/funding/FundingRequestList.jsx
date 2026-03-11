import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const FundingRequestList = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/funding-requests')
      .then(r => setRequests(r.data))
      .catch(() => setError('Failed to load funding requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await API.put(`/funding-requests/${id}/approve`);
      setRequests(requests.map(r => r._id === id ? res.data : r));
    } catch {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      const res = await API.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setRequests(requests.map(r => r._id === id ? res.data : r));
    } catch {
      alert('Failed to reject request');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Funding Requests</h1>
        <Link to="/funding-requests/new" className="btn btn-primary">+ New Request</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">No funding requests found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Amount (UGX)</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td><strong>{req.title}</strong></td>
                    <td>{req.project?.name || '—'}</td>
                    <td>{req.amount.toLocaleString()}</td>
                    <td>{req.requestedBy?.name || '—'}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        {user?.role === 'director' && req.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(req._id)}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(req._id)}>
                              Reject
                            </button>
                          </>
                        )}
                        {req.rejectionReason && (
                          <span title={req.rejectionReason} style={{ cursor: 'help', color: '#e74c3c' }}>⚠</span>
                        )}
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

export default FundingRequestList;
