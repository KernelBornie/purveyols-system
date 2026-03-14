import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [boqs, setBOQs] = useState([]);
  const [subcontracts, setSubcontracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boqRes, subRes] = await Promise.all([
          API.get('/boq'),
          API.get('/subcontracts'),
        ]);
        setBOQs(boqRes.data.boqs || boqRes.data || []);
        setSubcontracts(subRes.data.subcontracts || subRes.data || []);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>🛠️ Admin Dashboard</h1>
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #1565c0', padding: '16px' }}>
          <div style={{ fontSize: '1.6rem' }}>📋</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1565c0' }}>{boqs.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>BOQ Items</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2e7d32', padding: '16px' }}>
          <div style={{ fontSize: '1.6rem' }}>🏗️</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2e7d32' }}>{subcontracts.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Subcontracts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>📋 Bills of Quantities</h3>
            <Link to="/boq/new" className="btn btn-primary btn-sm">+ New BOQ</Link>
          </div>
          {boqs.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No BOQ items yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {boqs.slice(0, 5).map(b => (
                  <tr key={b._id}>
                    <td>{b.title || '—'}</td>
                    <td>K{(b.totalAmount || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${b.status === 'approved' ? 'active' : 'pending'}`}>{b.status || 'draft'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/boq" style={{ fontSize: '0.85rem', color: '#1565c0', display: 'block', marginTop: '8px' }}>View all →</Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>🏗️ Subcontracts</h3>
            <Link to="/subcontracts/new" className="btn btn-primary btn-sm">+ New</Link>
          </div>
          {subcontracts.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No subcontracts yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subcontracts.slice(0, 5).map(s => (
                  <tr key={s._id}>
                    <td>{s.name || '—'} ({s.company || '—'})</td>
                    <td>K{(s.amount || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'active' : 'pending'}`}>{s.status || 'active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/subcontracts" style={{ fontSize: '0.85rem', color: '#1565c0', display: 'block', marginTop: '8px' }}>View all →</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
