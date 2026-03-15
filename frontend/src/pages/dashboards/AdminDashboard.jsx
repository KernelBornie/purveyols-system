import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ROLE_COLORS = {
  director: '#1565c0',
  engineer: '#e65100',
  accountant: '#2e7d32',
  foreman: '#6a1b9a',
  driver: '#00796b',
  procurement: '#4e342e',
  safety: '#c62828',
  admin: '#37474f',
  worker: '#f57c00',
};

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes, workersRes] = await Promise.all([
          API.get('/users'),
          API.get('/projects'),
          API.get('/workers'),
        ]);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setWorkers(workersRes.data.workers || []);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <div>
      <div className="page-header">
        <h1>🛠️ Admin Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name} — System Maintenance &amp; checkups</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* System Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Registered Users', value: users.length, icon: '👤', color: '#1565c0' },
          { label: 'Total Projects', value: projects.length, icon: '🏗️', color: '#2e7d32' },
          { label: 'Active Projects', value: activeProjects, icon: '✅', color: '#e65100' },
          { label: 'Completed Projects', value: completedProjects, icon: '🏁', color: '#6a1b9a' },
          { label: 'Enrolled Workers', value: workers.length, icon: '👷', color: '#00796b' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Role Distribution */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>👥 Users by Role</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} style={{
              background: ROLE_COLORS[role] || '#546e7a',
              color: '#fff',
              borderRadius: '20px',
              padding: '6px 16px',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}>
              {role} × {count}
            </div>
          ))}
          {Object.keys(roleCounts).length === 0 && (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No users registered yet.</p>
          )}
        </div>
      </div>

      {/* Registered Users Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>👤 Registered System Users</h3>
        {users.length === 0 ? (
          <div className="empty-state">No users registered yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u._id}>
                    <td>{idx + 1}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span style={{
                        background: ROLE_COLORS[u.role] || '#546e7a',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '2px 10px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects Overview */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>🏗️ Projects Overview</h3>
        {projects.length === 0 ? (
          <div className="empty-state">No projects found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Engineer</th>
                  <th>Foreman</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.location || '—'}</td>
                    <td>{p.assignedEngineer?.name || '—'}</td>
                    <td>{p.assignedForeman?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'active' ? 'active' : p.status === 'completed' ? 'approved' : 'pending'}`}>
                        {p.status || 'unknown'}
                      </span>
                    </td>
                    <td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}</td>
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

export default AdminDashboard;
