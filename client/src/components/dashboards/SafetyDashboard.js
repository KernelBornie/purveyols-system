import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner, Badge } from '../shared/UI';

const SafetyDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/safety-reports')
      .then((res) => setReports(res.data.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.put(`/safety-reports/${id}/status`, { status });
      setReports((prev) => prev.map((r) => (r._id === id ? res.data.report : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#b71c1c' }}>⚠️ Safety Officer Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Open Reports" value={reports.filter(r => r.status === 'open').length} icon="🔴" color="#b71c1c" />
        <StatCard label="Investigating" value={reports.filter(r => r.status === 'investigating').length} icon="🔍" color="#e65100" />
        <StatCard label="Closed" value={reports.filter(r => r.status === 'closed').length} icon="✅" color="#2e7d32" />
        <StatCard label="Total Reports" value={reports.length} icon="📋" color="#b71c1c" />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/safety/new" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#b71c1c', color: '#fff', borderRadius: '8px', padding: '1rem', textAlign: 'center', fontWeight: '600', cursor: 'pointer' }}>
            + Report New Safety Incident
          </div>
        </Link>
      </div>

      <Card title="⚠️ Safety Reports">
        {reports.length === 0 ? (
          <p style={{ color: '#666' }}>No safety reports filed.</p>
        ) : (
          reports.map((report) => (
            <div key={report._id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{report.incidentType?.replace('-', ' ')}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Site: {report.site} • {new Date(report.date).toLocaleDateString()} • <Badge status={report.severity} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>{report.description.substring(0, 120)}{report.description.length > 120 ? '...' : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
                  <Badge status={report.status} />
                  {report.status === 'open' && (
                    <button onClick={() => handleStatusUpdate(report._id, 'investigating')} style={{ background: '#e65100', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Investigate</button>
                  )}
                  {report.status === 'investigating' && (
                    <button onClick={() => handleStatusUpdate(report._id, 'closed')} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default SafetyDashboard;
