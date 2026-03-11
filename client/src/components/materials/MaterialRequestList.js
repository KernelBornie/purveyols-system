import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card, { LoadingSpinner, Badge, Button } from '../shared/UI';

const MaterialRequestList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/material-requests')
      .then((res) => setRequests(res.data.requests || []))
      .catch(() => setError('Failed to load material requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    const supplier = status === 'ordered' ? (window.prompt('Supplier name:') || '') : '';
    if (status === 'ordered' && supplier === null) return;
    try {
      const res = await api.put(`/material-requests/${id}/status`, { status, supplier });
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data.request : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  const canCreate = ['engineer', 'foreman', 'procurement'].includes(user?.role);
  const canManage = ['procurement', 'director'].includes(user?.role);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>🔧 Material Requests</h2>
        {canCreate && <Link to="/materials/new"><Button variant="primary">+ New Request</Button></Link>}
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      <Card>
        {requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No material requests found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Item', 'Qty', 'Unit', 'Est. Cost', 'Site', 'Urgency', 'Requested By', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{req.itemName}</td>
                    <td style={{ padding: '10px 12px' }}>{req.quantity}</td>
                    <td style={{ padding: '10px 12px' }}>{req.unit}</td>
                    <td style={{ padding: '10px 12px' }}>{req.estimatedCost ? `K${req.estimatedCost.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{req.site}</td>
                    <td style={{ padding: '10px 12px' }}><Badge status={req.urgency} /></td>
                    <td style={{ padding: '10px 12px' }}>{req.requestedBy?.name}</td>
                    <td style={{ padding: '10px 12px' }}><Badge status={req.status} /></td>
                    {canManage && (
                      <td style={{ padding: '10px 12px' }}>
                        {req.status === 'pending' && (
                          <button onClick={() => handleStatus(req._id, 'ordered')} style={{ background: '#1565c0', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}>Order</button>
                        )}
                        {req.status === 'ordered' && (
                          <button onClick={() => handleStatus(req._id, 'delivered')} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}>Delivered</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MaterialRequestList;
