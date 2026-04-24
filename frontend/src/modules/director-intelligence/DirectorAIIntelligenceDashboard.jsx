import { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Inline helpers
// ---------------------------------------------------------------------------

const RiskBadge = ({ level }) => {
  const map = {
    low: { color: '#2e7d32', bg: '#e8f5e9' },
    medium: { color: '#f57c00', bg: '#fff3e0' },
    high: { color: '#c62828', bg: '#ffebee' },
    critical: { color: '#fff', bg: '#b71c1c' },
  };
  const s = map[level] || map.low;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30`, borderRadius: '12px', padding: '2px 10px', fontSize: '0.76rem', fontWeight: '700', textTransform: 'uppercase' }}>
      {level}
    </span>
  );
};

const MetricCard = ({ label, value, icon, color, sub }) => (
  <div className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
    <div style={{ fontSize: '1.6rem' }}>{icon}</div>
    <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>{sub}</div>}
  </div>
);

// Simple inline bar chart
const MiniBar = ({ value, max, color }) => (
  <div style={{ background: '#eee', borderRadius: '4px', height: '8px', width: '100%', overflow: 'hidden' }}>
    <div style={{ background: color, width: `${Math.round((value / Math.max(max, 1)) * 100)}%`, height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
  </div>
);

// ---------------------------------------------------------------------------
// Director AI Intelligence Dashboard
// ---------------------------------------------------------------------------

const DirectorAIIntelligenceDashboard = () => {
  const { user } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [sites, setSites] = useState([]);
  const [boqs, setBOQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-project AI intelligence
  const [projectIntel, setProjectIntel] = useState({});
  const [intelLoading, setIntelLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, projectsRes, workersRes, fundingRes, sitesRes, boqRes] = await Promise.all([
        API.get('/reports/summary'),
        API.get('/projects'),
        API.get('/workers'),
        API.get('/funding-requests?status=pending'),
        API.get('/sites'),
        API.get('/boq'),
      ]);
      setSummary(summaryRes.data);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.projects || []);
      setWorkers(workersRes.data.workers || []);
      setFundingRequests(fundingRes.data.requests || []);
      setSites(sitesRes.data.sites || []);
      setBOQs(boqRes.data.boqs || []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runProjectIntelligence = async () => {
    if (projects.length === 0) return;
    setIntelLoading(true);
    const results = {};
    await Promise.all(
      projects.map(async (p) => {
        try {
          const daysRemaining = p.endDate
              ? Math.max(0, Math.round((new Date(p.endDate) - new Date()) / 86400000))
              : 90;
          const [intelRes, riskRes] = await Promise.all([
            API.post('/ai/project-intelligence', {
              startDate: p.startDate,
              endDate: p.endDate,
              budgetTotal: p.budget || 0,
            }),
            API.post('/ai/risk-analyze', {
              budget: p.budget || 0,
              daysRemaining,
            }),
          ]);
          results[p._id] = { intelligence: intelRes.data, risk: riskRes.data };
        } catch {
          results[p._id] = null;
        }
      })
    );
    setProjectIntel(results);
    setIntelLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/funding-requests/${id}/approve`);
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await API.put(`/funding-requests/${id}/reject`, { rejectionReason: reason });
      setFundingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <div className="loading">Loading Director Intelligence Dashboard...</div>;

  const totalPaid = (summary?.payments?.totalAmount || 0);
  const activeSites = [...new Set(workers.map((w) => w.site).filter(Boolean))].length;
  const totalBOQValue = boqs.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'in-progress').length;

  // Aggregate risk across analyzed projects
  const analyzedProjects = Object.values(projectIntel).filter(Boolean);
  const criticalCount = analyzedProjects.filter((a) => a.risk?.riskLevel === 'critical').length;
  const highCount = analyzedProjects.filter((a) => a.risk?.riskLevel === 'high').length;
  const avgRisk = analyzedProjects.length > 0
    ? Math.round(analyzedProjects.reduce((s, a) => s + (a.risk?.riskScore || 0), 0) / analyzedProjects.length)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>🏢 Director AI Intelligence</h1>
          <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Enterprise Construction Operating System · {user?.name}</div>
        </div>
        <button
          onClick={runProjectIntelligence}
          disabled={intelLoading || projects.length === 0}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {intelLoading ? '⏳ Analyzing...' : '🧠 Run AI Intelligence'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Top-level KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard label="Total Projects" value={projects.length} icon="🏗️" color="#1565c0" sub={`${activeProjects} active`} />
        <MetricCard label="Registered Sites" value={sites.length} icon="📍" color="#00796b" />
        <MetricCard label="Total Workers" value={workers.length} icon="👷" color="#e65100" />
        <MetricCard label="Total Paid (ZMW)" value={`K${totalPaid.toLocaleString()}`} icon="💰" color="#2e7d32" />
        <MetricCard label="Pending Approvals" value={fundingRequests.length} icon="📋" color={fundingRequests.length > 0 ? '#c62828' : '#666'} />
        <MetricCard label="Total BOQ Value" value={`K${totalBOQValue.toLocaleString()}`} icon="📐" color="#6a1b9a" sub={`${boqs.length} BOQs`} />
        <MetricCard label="Active Sites" value={activeSites} icon="🔨" color="#4e342e" />
        {avgRisk !== null && (
          <MetricCard
            label="Avg Project Risk"
            value={`${avgRisk}/100`}
            icon="⚠️"
            color={avgRisk >= 50 ? '#c62828' : avgRisk >= 25 ? '#f57c00' : '#2e7d32'}
            sub={criticalCount > 0 ? `${criticalCount} critical` : highCount > 0 ? `${highCount} high risk` : 'All low risk'}
          />
        )}
      </div>

      {/* Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '👷', label: 'Workers', to: '/workers' },
          { icon: '📋', label: 'Funding Requests', to: '/funding-requests' },
          { icon: '💳', label: 'Payments', to: '/payments' },
          { icon: '🏗️', label: 'Projects', to: '/projects' },
          { icon: '🚛', label: 'Logbooks', to: '/logbooks' },
          { icon: '📊', label: 'Reports', to: '/reports' },
          { icon: '📐', label: 'BOQ', to: '/boq' },
          { icon: '📍', label: 'Sites', to: '/sites' },
        ].map(({ icon, label, to }) => (
          <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color: '#333', textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Project Intelligence Table */}
      {projects.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>🧠 Project Intelligence Overview</h3>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Budget (ZMW)</th>
                  <th>Progress</th>
                  <th>Risk Level</th>
                  <th>Delay Risk</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const intel = projectIntel[p._id];
                  return (
                    <tr key={p._id}>
                      <td><strong>{p.name}</strong><div style={{ fontSize: '0.75rem', color: '#999' }}>{p.location || '—'}</div></td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                      <td>{p.budget ? `K${p.budget.toLocaleString()}` : '—'}</td>
                      <td style={{ minWidth: '120px' }}>
                        {intel ? (
                          <>
                            <div style={{ fontSize: '0.8rem', marginBottom: '4px' }}>{intel.intelligence.overallProgress}%</div>
                            <MiniBar value={intel.intelligence.overallProgress} max={100} color={intel.intelligence.overallProgress < 30 ? '#f57c00' : '#2e7d32'} />
                          </>
                        ) : '—'}
                      </td>
                      <td>{intel ? <RiskBadge level={intel.risk.riskLevel} /> : <span style={{ color: '#bbb' }}>—</span>}</td>
                      <td style={{ fontSize: '0.82rem', color: intel?.intelligence?.delayRisk === 'delayed' ? '#c62828' : intel?.intelligence?.delayRisk === 'at-risk' ? '#f57c00' : '#2e7d32' }}>
                        {intel ? (intel.intelligence.delayRisk === 'on-track' ? '✅ On Track' : intel.intelligence.delayRisk === 'at-risk' ? '⚠️ At Risk' : `🔴 Delayed ${intel.intelligence.delayDays}d`) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {Object.keys(projectIntel).length === 0 && (
            <div style={{ textAlign: 'center', padding: '12px', color: '#aaa', fontSize: '0.85rem' }}>
              Click <strong>"Run AI Intelligence"</strong> to analyze all projects
            </div>
          )}
        </div>
      )}

      {/* BOQ Summary */}
      {boqs.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>📐 BOQ Summaries</h3>
            <Link to="/boq" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Title</th><th>Project</th><th>Site</th><th>Total (ZMW)</th><th>Status</th></tr></thead>
              <tbody>
                {boqs.slice(0, 8).map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.project?.name || '—'}</td>
                    <td>{b.site || '—'}</td>
                    <td>K{(b.totalAmount || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Funding Approvals */}
      {fundingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>📋 Funding Requests Pending Approval</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>From</th><th>Role</th><th>Type</th><th>Amount (ZMW)</th><th>Site</th><th>Description</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {fundingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td>{req.requestedBy?.name}</td>
                    <td>{req.requestedBy?.role}</td>
                    <td>{req.title}</td>
                    <td>K{req.amount?.toLocaleString()}</td>
                    <td>{req.site || '—'}</td>
                    <td>{req.description}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(req._id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(req._id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workers */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>👷 General Workers</h3>
        {workers.length === 0 ? (
          <div className="empty-state">No workers enrolled yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Name</th><th>NRC</th><th>Phone</th><th>Site</th><th>Daily Rate</th><th>Enrolled By</th><th>Date</th></tr></thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td><td>{w.nrc}</td><td>{w.phone}</td><td>{w.site}</td>
                    <td>K{w.dailyRate}</td>
                    <td>{w.enrolledBy?.name} ({w.enrolledBy?.role})</td>
                    <td>{w.enrolledAt ? new Date(w.enrolledAt).toLocaleDateString() : new Date(w.createdAt).toLocaleDateString()}</td>
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

export default DirectorAIIntelligenceDashboard;
