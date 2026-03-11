import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const WorkerList = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    API.get('/workers')
      .then(r => setWorkers(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load workers'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this worker?')) return;
    try {
      await API.delete(`/workers/${id}`);
      setWorkers(workers.map(w => w._id === id ? { ...w, status: 'inactive' } : w));
    } catch {
      alert('Failed to deactivate worker');
    }
  };

  const filtered = statusFilter ? workers.filter(w => w.status === statusFilter) : workers;

  return (
    <div>
      <div className="page-header">
        <h1>Workers</h1>
        <Link to="/workers/new" className="btn btn-primary">+ Enroll Worker</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filter-bar">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No workers found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>National ID</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Enrolled At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(worker => (
                  <tr key={worker._id}>
                    <td>{worker.name}</td>
                    <td>{worker.nationalId}</td>
                    <td>{worker.role}</td>
                    <td>{worker.phone || '—'}</td>
                    <td>{worker.project?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${worker.status}`}>{worker.status}</span>
                    </td>
                    <td>{new Date(worker.enrolledAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/workers/${worker._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        {['director', 'engineer'].includes(user?.role) && worker.status === 'active' && (
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
      </div>
    </div>
  );
};

export default WorkerList;
