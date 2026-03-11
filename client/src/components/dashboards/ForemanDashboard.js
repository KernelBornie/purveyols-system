import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner } from '../shared/UI';

const ForemanDashboard = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/funding-requests')
      .then((res) => setMyRequests(res.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#4a148c' }}>🦺 Foreman Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="My Requests" value={myRequests.length} icon="📋" color="#4a148c" />
        <StatCard label="Pending" value={myRequests.filter(r => r.status === 'pending').length} icon="⏳" color="#e65100" />
        <StatCard label="Approved" value={myRequests.filter(r => r.status === 'approved').length} icon="✅" color="#2e7d32" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '👷', label: 'Enroll Workers', to: '/workers/new', color: '#4a148c' },
          { icon: '👥', label: 'View Workers', to: '/workers', color: '#4a148c' },
          { icon: '📋', label: 'Request Funding', to: '/funding-requests/new', color: '#e65100' },
          { icon: '🔧', label: 'Request Materials', to: '/materials/new', color: '#4527a0' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontWeight: '600', color }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <Card title="📋 My Funding Requests">
        {myRequests.length === 0 ? (
          <p style={{ color: '#666' }}>No requests yet. <Link to="/funding-requests/new">Create one</Link></p>
        ) : (
          myRequests.slice(0, 5).map((req) => (
            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontWeight: '500' }}>{req.title} — K{req.amount?.toLocaleString()}</span>
              <span style={{ textTransform: 'capitalize', color: req.status === 'approved' ? '#2e7d32' : req.status === 'rejected' ? '#c62828' : '#e65100', fontSize: '0.85rem', fontWeight: '600' }}>
                {req.status}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default ForemanDashboard;
