import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    API.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
    } catch {
      alert('Failed to delete project');
    }
  };

  const filtered = statusFilter ? projects.filter(p => p.status === statusFilter) : projects;

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        {['director', 'engineer'].includes(user?.role) && (
          <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filter-bar">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No projects found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Budget (UGX)</th>
                  <th>Engineer</th>
                  <th>Foreman</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(project => (
                  <tr key={project._id}>
                    <td><strong>{project.name}</strong></td>
                    <td>{project.location || '—'}</td>
                    <td>
                      <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </td>
                    <td>{project.budget ? project.budget.toLocaleString() : '—'}</td>
                    <td>{project.assignedEngineer?.name || '—'}</td>
                    <td>{project.assignedForeman?.name || '—'}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        {user?.role === 'director' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project._id)}>
                            Delete
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

export default ProjectList;
