import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SurveyorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, fundingRes, materialRes, projectsRes] = await Promise.all([
          API.get('/workers'),
          API.get('/funding-requests'),
          API.get('/procurement'),
          API.get('/projects'),
        ]);
        setWorkers((workersRes.data.workers || []).filter((w) => w.enrolledBy?._id === user?._id));
        setFundingRequests(fundingRes.data.requests || []);
        setMaterialRequests(Array.isArray(materialRes.data) ? materialRes.data : []);
        setProjects(projectsRes.data.projects || projectsRes.data || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="loading">Loading Surveyor Dashboard...</div>;

  const pendingFunding = fundingRequests.filter((r) => r.status === 'pending').length;
  const approvedFunding = fundingRequests.filter((r) => r.status === 'approved').length;

  return (
    <div>
      <div className="page-header">
        <h1>📐 Surveyor Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'My Workers', value: workers.length, icon: '👷', color: '#e65100' },
          { label: 'Pending Funding', value: pendingFunding, icon: '⏳', color: '#f57c00' },
          { label: 'Approved Funding', value: approvedFunding, icon: '✅', color: '#2e7d32' },
          { label: 'Material Requests', value: materialRequests.length, icon: '🔧', color: '#6a1b9a' },
          { label: 'Projects Created', value: projects.length, icon: '🏗️', color: '#1565c0' },
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
        {[
          { icon: '👷', label: 'Enroll Worker', to: '/workers/new', color: '#e65100' },
          { icon: '👥', label: 'View Workers', to: '/workers', color: '#e65100' },
          { icon: '💰', label: 'Request Funding', to: '/funding-requests/new', color: '#1565c0' },
          { icon: '🏗️', label: 'Create Project', to: '/projects/new', color: '#2e7d32' },
          { icon: '🔧', label: 'Request Materials', to: '/procurement/new', color: '#6a1b9a' },
          { icon: '📁', label: 'View Projects', to: '/projects', color: '#2e7d32' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to + label} to={to} className="card" style={{ textDecoration: 'none', color, textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* My Enrolled Workers */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>👷 My Enrolled General Workers</h3>
          <Link to="/workers/new" className="btn btn-primary btn-sm">+ Enroll</Link>
        </div>
        {workers.length === 0 ? (
          <div className="empty-state">No workers enrolled yet. <Link to="/workers/new">Enroll a worker</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>NRC</th>
                  <th>Phone</th>
                  <th>Daily Rate</th>
                  <th>Site</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td>
                    <td>{w.nrc}</td>
                    <td>{w.phone}</td>
                    <td>K{w.dailyRate}</td>
                    <td>{w.site}</td>
                    <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🏗️ Projects</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
            <Link to="/projects/new" className="btn btn-primary btn-sm">+ New</Link>
          </div>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">No projects yet. <Link to="/projects/new">Create a project</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.location || '—'}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Funding Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>💰 My Funding Requests</h3>
          <Link to="/funding-requests/new" className="btn btn-primary btn-sm">+ New</Link>
        </div>
        {fundingRequests.length === 0 ? (
          <div className="empty-state">No funding requests yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Amount (ZMW)</th>
                  <th>Site</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fundingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.title}</td>
                    <td>K{req.amount?.toLocaleString()}</td>
                    <td>{req.site || '—'}</td>
                    <td>
                      <span className={`badge badge-${req.status}`}>{req.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material Requests */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🔧 My Material Requests to Procurement</h3>
          <Link to="/procurement/new" className="btn btn-primary btn-sm">+ New Request</Link>
        </div>
        {materialRequests.length === 0 ? (
          <div className="empty-state">No material requests yet. <Link to="/procurement/new">Make a request</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.itemName}</td>
                    <td>{req.quantity}</td>
                    <td>{req.unitPrice ? `K${req.unitPrice?.toLocaleString()}` : '—'}</td>
                    <td>{req.totalPrice ? `K${req.totalPrice?.toLocaleString()}` : '—'}</td>
                    <td>{req.supplier || '—'}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
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

