import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner, Badge } from '../shared/UI';

const AccountantDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pendingFunding, setPendingFunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, fundingRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/funding-requests?status=pending'),
        ]);
        setSummary(summaryRes.data);
        setPendingFunding(fundingRes.data.requests || []);
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
      await api.put(`/funding-requests/${id}/approve`);
      setPendingFunding((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setPendingFunding((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#1b5e20' }}>💼 Accountant Dashboard</h2>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Active Workers" value={summary.workers?.active || 0} icon="👷" color="#1b5e20" />
          <StatCard label="Wages Paid (Month)" value={`K${(summary.payments?.totalAmount || 0).toLocaleString()}`} icon="💰" color="#1b5e20" />
          <StatCard label="Pending Approvals" value={pendingFunding.length} icon="📋" color="#e65100" />
          <StatCard label="Pending Materials" value={summary.materialRequests?.pending || 0} icon="🔧" color="#4527a0" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '👷', label: 'Workers', to: '/workers', color: '#1b5e20' },
          { icon: '💸', label: 'Process Payments', to: '/payments', color: '#1b5e20' },
          { icon: '📋', label: 'Funding Requests', to: '/funding-requests', color: '#e65100' },
          { icon: '📈', label: 'Reports', to: '/reports', color: '#1b5e20' },
          { icon: '🚛', label: 'Logbooks', to: '/logbooks', color: '#006064' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontWeight: '600', color }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {pendingFunding.length > 0 && (
        <Card title="📋 Pending Funding Requests">
          {pendingFunding.map((req) => (
            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{req.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {req.requestedBy?.name} ({req.requestedByRole}) • K{req.amount?.toLocaleString()} • <Badge status={req.priority} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleApprove(req._id)} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Approve</button>
                <button onClick={() => handleReject(req._id)} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Reject</button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default AccountantDashboard;
