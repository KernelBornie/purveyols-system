import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card, { LoadingSpinner, Badge, Button } from '../shared/UI';

const SafetyReportList = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/safety-reports')
      .then((res) => setReports(res.data.reports || []))
      .catch(() => setError('Failed to load safety reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    try {
      const res = await api.put(`/safety-reports/${id}/status`, { status });
      setReports((prev) => prev.map((r) => (r._id === id ? res.data.report : r)));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  const canCreate = ['safety', 'foreman', 'engineer', 'director'].includes(user?.role);
  const canManage = ['safety', 'director'].includes(user?.role);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>⚠️ Safety Reports</h2>
        {canCreate && <Link to="/safety/new"><Button variant="danger">+ Report Incident</Button></Link>}
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      <Card>
        {reports.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No safety reports found.</p>
        ) : (
          reports.map((report) => (
            <div key={report._id} style={{ padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{report.incidentType?.replace('-', ' ')}</span>
                    <Badge status={report.status} />
                    <Badge status={report.severity} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Site: {report.site} • {new Date(report.date).toLocaleDateString()} • By: {report.reportedBy?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>{report.description}</div>
                  {report.actionTaken && <div style={{ fontSize: '0.83rem', color: '#777', marginTop: '4px' }}>Action: {report.actionTaken}</div>}
                </div>
                {canManage && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {report.status === 'open' && (
                      <button onClick={() => handleStatus(report._id, 'investigating')} style={{ background: '#e65100', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Investigate</button>
                    )}
                    {report.status === 'investigating' && (
                      <button onClick={() => handleStatus(report._id, 'closed')} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default SafetyReportList;
