import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SiteList = () => {
  const { user } = useContext(AuthContext);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/sites')
      .then((res) => setSites(res.data.sites || []))
      .catch(() => setError('Failed to load sites'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading sites...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📍 Sites</h1>
        <Link to="/sites/new" className="btn btn-primary">+ New Site</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {sites.length === 0 ? (
        <div className="card empty-state">No sites registered yet. <Link to="/sites/new">Create one</Link></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Terrain</th>
                  <th>Accessibility</th>
                  <th>Area (m²)</th>
                  <th>Status</th>
                  <th>GPS Points</th>
                  <th>Created By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong>{s.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>{s.projectName || s.project?.name || '—'}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.siteType}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.terrain}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.accessibility}</td>
                    <td>{s.area > 0 ? s.area.toLocaleString() : '—'}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td>{s.coordinates?.length || 0}</td>
                    <td>
                      {s.createdBy?.name}
                      <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{s.createdBy?.role}</div>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteList;
