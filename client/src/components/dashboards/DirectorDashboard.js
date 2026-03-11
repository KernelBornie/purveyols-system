import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner } from '../shared/UI';

const DirectorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, fundingRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/funding-requests?status=approved'),
        ]);
        setSummary(summaryRes.data);
        setFundingRequests(fundingRes.data.requests || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDisburse = async (id) => {
    try {
      await api.put(`/funding-requests/${id}/disburse`);
      setFundingRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'disbursed' } : r))
      );
    } catch (err) {
      alert('Failed to disburse: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#1a237e' }}>📊 Director Dashboard</h2>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Active Workers" value={summary.workers?.active || 0} icon="👷" color="#1a237e" />
          <StatCard label="Wages Paid (Month)" value={`K${(summary.payments?.totalAmount || 0).toLocaleString()}`} icon="💰" color="#2e7d32" />
          <StatCard label="Pending Funding" value={summary.fundingRequests?.pending || 0} icon="📋" color="#e65100" />
          <StatCard label="Pending Materials" value={summary.materialRequests?.pending || 0} icon="🔧" color="#4527a0" />
          <StatCard label="Vehicle Trips" value={summary.logistics?.trips || 0} icon="🚛" color="#006064" />
          <StatCard label="Total Distance" value={`${(summary.logistics?.totalDistance || 0).toLocaleString()} km`} icon="📍" color="#880e4f" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '👷', label: 'Workers', desc: 'View enrolled workers', to: '/workers', color: '#1a237e' },
          { icon: '💸', label: 'Payments', desc: 'Wage payment history', to: '/payments', color: '#2e7d32' },
          { icon: '📋', label: 'Funding Requests', desc: 'Review & disburse funds', to: '/funding-requests', color: '#e65100' },
          { icon: '🔧', label: 'Material Requests', desc: 'Procurement overview', to: '/materials', color: '#4527a0' },
          { icon: '🚛', label: 'Driver Logbooks', desc: 'Vehicle usage reports', to: '/logbooks', color: '#006064' },
          { icon: '⚠️', label: 'Safety Reports', desc: 'Incident tracking', to: '/safety', color: '#b71c1c' },
          { icon: '📈', label: 'Reports', desc: 'Weekly & monthly reports', to: '/reports', color: '#1b5e20' },
        ].map(({ icon, label, desc, to, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, cursor: 'pointer', transition: 'transform 0.1s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontWeight: '600', color, marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {fundingRequests.filter(r => r.status === 'approved').length > 0 && (
        <Card title="💰 Approved Funding - Ready to Disburse">
          {fundingRequests.filter(r => r.status === 'approved').map((req) => (
            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{req.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  By: {req.requestedBy?.name} • K{req.amount?.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleDisburse(req._id)}
                style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Disburse
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default DirectorDashboard;
