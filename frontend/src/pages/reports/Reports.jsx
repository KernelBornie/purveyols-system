import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/reports/summary')
      .then(r => setSummary(r.data))
      .catch(() => setError('Failed to load report summary'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>📊 Reports &amp; Summary</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : summary && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Workers', value: summary.workers?.total || 0, sub: `${summary.workers?.active || 0} active`, icon: '👷', color: '#1565c0' },
              { label: 'Total Projects', value: summary.projects?.total || 0, icon: '🏗️', color: '#2e7d32' },
              { label: 'Pending Funding', value: summary.fundingRequests?.pending || 0, icon: '⏳', color: '#e65100' },
              { label: 'Total Paid (ZMW)', value: `K${(summary.payments?.totalAmount || 0).toLocaleString()}`, sub: `${summary.payments?.count || 0} transactions`, icon: '💰', color: '#2e7d32' },
              { label: 'Open Safety Reports', value: summary.safetyReports?.open || 0, icon: '⚠️', color: '#b71c1c' },
              { label: 'Pending Materials', value: summary.materialRequests?.pending || 0, icon: '🔧', color: '#6a1b9a' },
            ].map(({ label, value, sub, icon, color }) => (
              <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
                <div style={{ fontSize: '1.6rem' }}>{icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
                {sub && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
