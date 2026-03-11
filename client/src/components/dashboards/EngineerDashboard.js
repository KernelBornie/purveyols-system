import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner } from '../shared/UI';

const EngineerDashboard = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [myMaterials, setMyMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fundingRes, materialRes] = await Promise.all([
          api.get('/funding-requests'),
          api.get('/material-requests'),
        ]);
        setMyRequests(fundingRes.data.requests || []);
        setMyMaterials(materialRes.data.requests || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const pending = myRequests.filter((r) => r.status === 'pending').length;
  const approved = myRequests.filter((r) => r.status === 'approved').length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e65100' }}>🔨 Engineer Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Pending Requests" value={pending} icon="⏳" color="#e65100" />
        <StatCard label="Approved" value={approved} icon="✅" color="#2e7d32" />
        <StatCard label="Material Orders" value={myMaterials.length} icon="🔧" color="#4527a0" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '👷', label: 'Enroll Workers', to: '/workers/new', color: '#e65100' },
          { icon: '👥', label: 'View Workers', to: '/workers', color: '#e65100' },
          { icon: '📋', label: 'Request Funding', to: '/funding-requests/new', color: '#e65100' },
          { icon: '🔧', label: 'Request Materials', to: '/materials/new', color: '#4527a0' },
          { icon: '⚠️', label: 'Safety Reports', to: '/safety', color: '#b71c1c' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontWeight: '600', color }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <Card title="📋 My Recent Funding Requests">
        {myRequests.length === 0 ? (
          <p style={{ color: '#666' }}>No funding requests yet. <Link to="/funding-requests/new">Create one</Link></p>
        ) : (
          myRequests.slice(0, 5).map((req) => (
            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <span style={{ fontWeight: '500' }}>{req.title}</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>K{req.amount?.toLocaleString()}</span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: '600', textTransform: 'capitalize', color: req.status === 'approved' ? '#2e7d32' : req.status === 'rejected' ? '#c62828' : '#e65100' }}>
                {req.status}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default EngineerDashboard;
