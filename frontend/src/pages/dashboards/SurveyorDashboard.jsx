import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SurveyorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [boqs, setBOQs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [boqRes, projectRes] = await Promise.all([
        API.get('/boq'),
        API.get('/projects'),
      ]);
      setBOQs(boqRes.data.boqs || boqRes.data || []);
      setProjects(projectRes.data.projects || projectRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Surveyor Dashboard...</div>;

  const totalBOQValue = boqs.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>📐 Surveyor Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total BOQs', value: boqs.length, icon: '📋', color: '#1565c0' },
          { label: 'Active Projects', value: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length, icon: '🏗️', color: '#2e7d32' },
          { label: 'Total Projects', value: projects.length, icon: '📁', color: '#6a1b9a' },
          {
            label: 'Total BOQ Value',
            value: `K${totalBOQValue.toLocaleString()}`,
            icon: '💰',
            color: '#e65100'
          },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <Link to="/boq/new" className="card" style={{ textDecoration: 'none', color: '#1565c0', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>📋</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>New BOQ</div>
        </Link>
        <Link to="/boq" className="card" style={{ textDecoration: 'none', color: '#2e7d32', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>📂</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>View All BOQs</div>
        </Link>
        <Link to="/projects" className="card" style={{ textDecoration: 'none', color: '#6a1b9a', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>🏗️</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>View Projects</div>
        </Link>
        <Link to="/reports" className="card" style={{ textDecoration: 'none', color: '#e65100', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.8rem' }}>📊</div>
          <div style={{ fontWeight: '600', marginTop: '6px' }}>Reports</div>
        </Link>
      </div>

      {/* Recent BOQs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>📋 Recent Bills of Quantities</h3>
          <Link to="/boq/new" className="btn btn-primary btn-sm">+ New BOQ</Link>
        </div>
        {boqs.length === 0 ? (
          <div className="empty-state">No BOQs found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {boqs.slice(0, 10).map((b) => (
                  <tr key={b._id}>
                    <td>{b.title}</td>
                    <td>{b.project?.name || b.projectName || '—'}</td>
                    <td>K{(b.totalAmount || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🏗️ Projects Overview</h3>
          <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">No projects found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 10).map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.location || '—'}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
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

export default SurveyorDashboard;
