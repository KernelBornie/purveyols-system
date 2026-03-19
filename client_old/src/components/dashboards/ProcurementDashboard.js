import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner, Badge } from '../shared/UI';

const ProcurementDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/material-requests')
      .then((res) => setRequests(res.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id, status) => {
    const supplier = status === 'ordered' ? window.prompt('Supplier name:') : '';
    if (status === 'ordered' && supplier === null) return;
    try {
      const res = await api.put(`/material-requests/${id}/status`, { status, supplier });
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data.request : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  const pending = requests.filter((r) => r.status === 'pending');
  const ordered = requests.filter((r) => r.status === 'ordered');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#880e4f' }}>📦 Procurement Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Pending Requests" value={pending.length} icon="⏳" color="#e65100" />
        <StatCard label="Ordered" value={ordered.length} icon="🛒" color="#1565c0" />
        <StatCard label="Total Requests" value={requests.length} icon="📋" color="#880e4f" />
      </div>

      <Card title="📦 Pending Material Requests">
        {pending.length === 0 ? (
          <p style={{ color: '#666' }}>No pending material requests.</p>
        ) : (
          pending.map((req) => (
            <div key={req._id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{req.itemName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {req.quantity} {req.unit} • Site: {req.site} • By: {req.requestedBy?.name}
                  </div>
                  {req.estimatedCost && <div style={{ fontSize: '0.83rem', color: '#888' }}>Est. Cost: K{req.estimatedCost?.toLocaleString()}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Badge status={req.urgency} />
                  <button onClick={() => handleUpdateStatus(req._id, 'ordered')} style={{ background: '#1565c0', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Order</button>
                  <button onClick={() => handleUpdateStatus(req._id, 'cancelled')} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card title="🛒 Ordered Items">
        {ordered.length === 0 ? (
          <p style={{ color: '#666' }}>No ordered items.</p>
        ) : (
          ordered.map((req) => (
            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <span style={{ fontWeight: '500' }}>{req.itemName}</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>• {req.supplier || 'Supplier TBD'}</span>
              </div>
              <button onClick={() => handleUpdateStatus(req._id, 'delivered')} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Mark Delivered</button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default ProcurementDashboard;
