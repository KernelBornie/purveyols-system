import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

const LogbookList = () => {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    API.get('/logbooks')
      .then(r => setLogbooks(r.data.entries || []))
      .catch(() => setError('Failed to load logbooks'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = typeFilter ? logbooks.filter(l => l.type === typeFilter) : logbooks;
  const displayProjectName = (log) => log.projectId?.name || log.project?.name || '—';
  const displayWorkerName = (log) => log.workerId?.name || log.worker?.name || log.workerEnrolled?.name || log.createdBy?.name || '—';
  const displayMetric = (log) => {
    if (log.type === 'work') {
      const value = log.hours ?? log.hoursWorked;
      return value != null ? `${value} hrs` : '—';
    }
    const value = log.distance ?? log.distanceTravelled ?? log.distanceKm;
    return value != null ? `${value} km` : '—';
  };
  const displayDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Logbooks</h1>
        <Link to="/logbooks/new" className="btn btn-primary">+ New Entry</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filter-bar">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="work">Work</option>
            <option value="vehicle">Vehicle</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading logbooks...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No logbook entries found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Project</th>
                  <th>Worker/Driver</th>
                  <th>Date</th>
                  <th>Hours / Distance</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log._id}>
                    <td><span className={`badge badge-${log.type}`}>{log.type}</span></td>
                    <td>{displayProjectName(log)}</td>
                    <td>{displayWorkerName(log)}</td>
                    <td>{displayDate(log.date)}</td>
                    <td>{displayMetric(log)}</td>
                    <td>{log.description || log.notes || '—'}</td>
                    <td>
                      <Link to={`/logbooks/${log._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                    </td>
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

export default LogbookList;
