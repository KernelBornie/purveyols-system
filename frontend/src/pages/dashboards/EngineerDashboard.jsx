import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const EngineerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [boqs, setBOQs] = useState([]);
  const [subcontracts, setSubcontracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, fundingRes, materialRes, boqRes, subRes] = await Promise.all([
          API.get('/workers'),
          API.get('/funding-requests'),
          API.get('/procurement'),
          API.get('/boq'),
          API.get('/subcontracts'),
        ]);
        setWorkers((workersRes.data.workers || []).filter((w) => w.enrolledBy?._id === user?._id));
        setFundingRequests(fundingRes.data.requests || []);
        setMaterialRequests(Array.isArray(materialRes.data) ? materialRes.data : []);
        setBOQs(boqRes.data.boqs || []);
        setSubcontracts(subRes.data.subcontracts || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="loading">Loading Engineer Dashboard...</div>;

  const pendingFunding = fundingRequests.filter((r) => r.status === 'pending').length;
  const approvedFunding = fundingRequests.filter((r) => r.status === 'approved').length;
  const draftBOQs = boqs.filter((b) => b.status === 'draft').length;
  const sharedBOQs = boqs.filter((b) => b.status === 'shared').length;
  const activeSubcontracts = subcontracts.filter((s) => s.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <h1>🔨 Engineer Dashboard</h1>
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
          { label: 'BOQs (Draft)', value: draftBOQs, icon: '📋', color: '#1565c0' },
          { label: 'BOQs (Shared)', value: sharedBOQs, icon: '📤', color: '#00796b' },
          { label: 'Active Subcontracts', value: activeSubcontracts, icon: '🏗️', color: '#4e342e' },
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
          { icon: '🔧', label: 'Request Materials', to: '/procurement/new', color: '#6a1b9a' },
          { icon: '📋', label: 'New BOQ', to: '/boq/new', color: '#1565c0' },
          { icon: '📂', label: 'All BOQs', to: '/boq', color: '#00796b' },
          { icon: '🏗️', label: 'Hire Personnel/Machinery', to: '/subcontracts/new', color: '#4e342e' },
          { icon: '📜', label: 'View Subcontracts', to: '/subcontracts', color: '#4e342e' },
          { icon: '🏗️', label: 'Projects', to: '/projects', color: '#2e7d32' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color, textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* BOQs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>📋 My Bills of Quantities (BOQ)</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/boq" className="btn btn-secondary btn-sm">View All</Link>
            <Link to="/boq/new" className="btn btn-primary btn-sm">+ New BOQ</Link>
          </div>
        </div>
        {boqs.length === 0 ? (
          <div className="empty-state">No BOQs yet. <Link to="/boq/new">Create a BOQ</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Site</th>
                  <th>Items</th>
                  <th>Total (ZMW)</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {boqs.slice(0, 5).map((boq) => (
                  <tr key={boq._id}>
                    <td><strong>{boq.title}</strong></td>
                    <td>{boq.site || '—'}</td>
                    <td>{boq.items?.length || 0}</td>
                    <td>K{boq.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${boq.status}`}>{boq.status}</span>
                    </td>
                    <td>{new Date(boq.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subcontracts – Hired Personnel & Machinery */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🏗️ Hired Personnel &amp; Machinery (Subcontracts)</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/subcontracts" className="btn btn-secondary btn-sm">View All</Link>
            <Link to="/subcontracts/new" className="btn btn-primary btn-sm">+ Hire</Link>
          </div>
        </div>
        {subcontracts.length === 0 ? (
          <div className="empty-state">No subcontracts yet. <Link to="/subcontracts/new">Hire personnel or machinery</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Company Hired From</th>
                  <th>Date Hired</th>
                  <th>Amount (ZMW)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subcontracts.slice(0, 5).map((s) => (
                  <tr key={s._id}>
                    <td style={{ textTransform: 'capitalize' }}>{s.type}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.category || '—'}</td>
                    <td>{s.company}</td>
                    <td>{new Date(s.dateHired).toLocaleDateString()}</td>
                    <td>K{s.amount?.toLocaleString()}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My General Workers */}
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
                  <th>Enrolled By</th>
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
                    <td>{w.enrolledBy?.name} ({w.enrolledBy?.role})</td>
                    <td>{new Date(w.createdAt).toLocaleDateString()}</td>
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

      {/* Material Requests to Procurement */}
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

export default EngineerDashboard;
