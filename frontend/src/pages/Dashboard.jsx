import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    projects: 0, workers: 0, fundingRequests: 0, procurement: 0, payments: 0, logbooks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const requests = [];
        const role = user?.role;

        if (['director', 'engineer', 'foreman'].includes(role)) {
          requests.push(API.get('/projects').then(r => ({ projects: r.data.length })));
          requests.push(API.get('/workers').then(r => ({ workers: r.data.length })));
        }
        if (['director', 'engineer', 'accountant'].includes(role)) {
          requests.push(API.get('/funding-requests').then(r => ({ fundingRequests: r.data.length })));
        }
        if (['director', 'procurement', 'engineer'].includes(role)) {
          requests.push(API.get('/procurement').then(r => ({ procurement: r.data.length })));
        }
        if (['director', 'accountant'].includes(role)) {
          requests.push(API.get('/payments').then(r => ({ payments: r.data.length })));
        }
        if (['director', 'engineer', 'foreman', 'driver'].includes(role)) {
          requests.push(API.get('/logbooks').then(r => ({ logbooks: r.data.length })));
        }

        const results = await Promise.allSettled(requests);
        const merged = {};
        results.forEach(r => { if (r.status === 'fulfilled') Object.assign(merged, r.value); });
        setStats(prev => ({ ...prev, ...merged }));
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const role = user?.role;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 16 }}>
          Welcome back, <strong>{user?.name}</strong>!
          You are logged in as <span className="badge badge-active">{user?.role}</span>.
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <div className="stat-cards">
          {['director', 'engineer', 'foreman'].includes(role) && (
            <>
              <div className="stat-card">
                <div className="stat-card-label">Projects</div>
                <div className="stat-card-value">{stats.projects}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-card-label">Workers</div>
                <div className="stat-card-value">{stats.workers}</div>
              </div>
            </>
          )}
          {['director', 'engineer', 'accountant'].includes(role) && (
            <div className="stat-card orange">
              <div className="stat-card-label">Funding Requests</div>
              <div className="stat-card-value">{stats.fundingRequests}</div>
            </div>
          )}
          {['director', 'procurement', 'engineer'].includes(role) && (
            <div className="stat-card purple">
              <div className="stat-card-label">Procurement Orders</div>
              <div className="stat-card-value">{stats.procurement}</div>
            </div>
          )}
          {['director', 'accountant'].includes(role) && (
            <div className="stat-card red">
              <div className="stat-card-label">Payments</div>
              <div className="stat-card-value">{stats.payments}</div>
            </div>
          )}
          {['director', 'engineer', 'foreman', 'driver'].includes(role) && (
            <div className="stat-card">
              <div className="stat-card-label">Logbook Entries</div>
              <div className="stat-card-value">{stats.logbooks}</div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['director', 'engineer', 'foreman'].includes(role) && (
            <>
              <Link to="/projects/new" className="btn btn-primary btn-sm">+ New Project</Link>
              <Link to="/workers/new" className="btn btn-primary btn-sm">+ Enroll Worker</Link>
            </>
          )}
          {['director', 'engineer', 'foreman', 'driver'].includes(role) && (
            <Link to="/logbooks/new" className="btn btn-secondary btn-sm">+ Log Entry</Link>
          )}
          {['director', 'engineer', 'accountant'].includes(role) && (
            <Link to="/funding-requests/new" className="btn btn-warning btn-sm">+ Funding Request</Link>
          )}
          {['director', 'procurement', 'engineer'].includes(role) && (
            <Link to="/procurement/new" className="btn btn-secondary btn-sm">+ Procurement Order</Link>
          )}
          {['accountant'].includes(role) && (
            <Link to="/payments/new" className="btn btn-success btn-sm">+ New Payment</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
