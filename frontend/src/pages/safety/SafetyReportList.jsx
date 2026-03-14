import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SafetyReportList = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    API.get('/safety-reports')
      .then(r => setReports(r.data.reports || []))
      .catch(() => setError('Failed to load safety reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await API.put(`/safety-reports/${id}/status`, { status });
      setReports(reports.map(r => r._id === id ? (res.data.report || res.data) : r));
      setMsg(`Report marked as ${status}`);
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>⚠️ Safety Reports</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading safety reports...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">No safety reports found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Action Taken</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  {['director', 'engineer'].includes(user?.role) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.site}</td>
                    <td>{r.incidentType}</td>
                    <td>
                      <span className={`badge badge-${r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'active'}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description}>
                      {r.description}
                    </td>
                    <td>{r.actionTaken || '—'}</td>
                    <td>{r.reportedBy ? `${r.reportedBy.name} (${r.reportedBy.role})` : 'Unknown'}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    {['director', 'engineer'].includes(user?.role) && (
                      <td>
                        <div className="actions">
                          {r.status === 'open' && (
                            <button className="btn btn-warning btn-sm" onClick={() => handleStatusUpdate(r._id, 'in-progress')}>
                              In Progress
                            </button>
                          )}
                          {r.status !== 'closed' && (
                            <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(r._id, 'closed')}>
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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

export default SafetyReportList;
