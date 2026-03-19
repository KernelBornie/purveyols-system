import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const WorkerList = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNrc, setSearchNrc] = useState('');

  useEffect(() => {
    API.get('/workers')
      .then(r => setWorkers(r.data.workers || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load workers'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this worker?')) return;
    try {
      const res = await API.put(`/workers/${id}/deactivate`);
      setWorkers(workers.map(w => w._id === id ? res.data.worker : w));
    } catch {
      alert('Failed to deactivate worker');
    }
  };

  const filtered = searchNrc
    ? workers.filter((w) =>
        w.nrc?.toLowerCase().includes(searchNrc.toLowerCase()) ||
        w.name?.toLowerCase().includes(searchNrc.toLowerCase())
      )
    : workers;

  return (
    <div>
      <div className="page-header">
        <h1>👷 General Workers</h1>
        <Link to="/workers/new" className="btn btn-primary">+ Enroll Worker</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div style={{ marginBottom: '12px' }}>
          <input
            className="form-control"
            placeholder="Search by name or NRC..."
            value={searchNrc}
            onChange={e => setSearchNrc(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No workers found. <Link to="/workers/new">Enroll a worker</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>NRC</th>
                  <th>Phone</th>
                  <th>Daily Rate (ZMW)</th>
                  <th>Overtime Rate (ZMW/hr)</th>
                  <th>Site</th>
                  <th>Network</th>
                  <th>Enrolled By</th>
                  <th>Date Enrolled</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(worker => (
                  <tr key={worker._id}>
                    <td>{worker.name}</td>
                    <td>{worker.nrc}</td>
                    <td>{worker.phone}</td>
                    <td>K{worker.dailyRate}</td>
                    <td>K{worker.overtimeRate ?? 0}</td>
                    <td>{worker.site}</td>
                    <td style={{ textTransform: 'capitalize' }}>{worker.mobileNetwork}</td>
                    <td>{worker.enrolledBy?.name} ({worker.enrolledBy?.role})</td>
                    <td>{worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge badge-${worker.isActive ? 'active' : 'inactive'}`}>
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {['director', 'engineer', 'foreman'].includes(user?.role) && (
                          <Link to={`/workers/${worker._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        )}
                        {['director', 'engineer'].includes(user?.role) && worker.isActive && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeactivate(worker._id)}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '12px', color: '#666', fontSize: '0.9rem' }}>
          Total: {filtered.length} worker{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default WorkerList;
