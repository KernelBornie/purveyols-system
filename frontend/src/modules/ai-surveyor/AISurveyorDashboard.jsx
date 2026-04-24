import { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Simple Map Placeholder – renders sites as positioned dots on a grid
// ---------------------------------------------------------------------------
const SiteMapPanel = ({ sites, onCapture }) => {
  const hasSites = sites.length > 0;

  return (
    <div style={{ background: '#0d1117', borderRadius: '8px', padding: '16px', minHeight: '220px', position: 'relative', overflow: 'hidden', border: '1px solid #30363d' }}>
      {/* Grid lines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(33,139,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(33,139,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#58a6ff', fontWeight: '700', fontSize: '0.9rem' }}>📍 LIVE SITE MAP</span>
          <button
            onClick={onCapture}
            style={{ background: '#1f6feb', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
          >
            📡 Capture GPS
          </button>
        </div>

        {!hasSites ? (
          <div style={{ color: '#8b949e', textAlign: 'center', paddingTop: '40px', fontSize: '0.85rem' }}>
            No sites registered yet.<br />
            <Link to="/sites/new" style={{ color: '#58a6ff' }}>Add a site →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
            {sites.map((site, i) => {
              const colors = ['#58a6ff', '#3fb950', '#f85149', '#d2a8ff', '#ffa657', '#79c0ff'];
              const color = colors[i % colors.length];
              return (
                <div key={site._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 10px', border: `1px solid ${color}40` }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '500' }}>{site.name}</span>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>{site.terrain || 'flat'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AI Insight Cards
// ---------------------------------------------------------------------------
const InsightCard = ({ label, value, icon, color, sub }) => (
  <div style={{ background: '#161b22', border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: '8px', padding: '14px' }}>
    <div style={{ fontSize: '1.4rem' }}>{icon}</div>
    <div style={{ fontSize: '1.3rem', fontWeight: '700', color, marginTop: '4px' }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '2px' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#6e7681', marginTop: '2px' }}>{sub}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Risk Badge
// ---------------------------------------------------------------------------
const RiskBadge = ({ level }) => {
  const map = { low: { color: '#3fb950', bg: '#3fb95020' }, medium: { color: '#ffa657', bg: '#ffa65720' }, high: { color: '#f85149', bg: '#f8514920' }, critical: { color: '#ff6e6e', bg: '#ff6e6e25' } };
  const s = map[level] || map.low;
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>{level}</span>;
};

// ---------------------------------------------------------------------------
// Main AI Surveyor Dashboard
// ---------------------------------------------------------------------------
const AISurveyorDashboard = () => {
  const { user } = useContext(AuthContext);

  // --- Standard data ---
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- AI panel state ---
  const [aiForm, setAiForm] = useState({ projectType: 'residential', area: 200, terrain: 'flat', location: 'urban' });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // --- GPS capture state ---
  const [gpsStatus, setGpsStatus] = useState('');

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const [workersRes, fundingRes, materialRes, projectsRes, sitesRes] = await Promise.all([
        API.get('/workers'),
        API.get('/funding-requests'),
        API.get('/procurement'),
        API.get('/projects'),
        API.get('/sites'),
      ]);
      setWorkers((workersRes.data.workers || []).filter((w) => w.enrolledBy?._id?.toString() === user?._id?.toString()));
      setFundingRequests(fundingRes.data.requests || []);
      setMaterialRequests(Array.isArray(materialRes.data) ? materialRes.data : []);
      setProjects(projectsRes.data.projects || projectsRes.data || []);
      setSites(sitesRes.data.sites || []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---------------------------------------------------------------------------
  // AI Engine
  // ---------------------------------------------------------------------------
  const handleAIAnalyze = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await API.post('/ai/analyze-site', aiForm);
      setAiResult(res.data);
    } catch {
      setAiError('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateBOQ = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await API.post('/ai/generate-boq', aiForm);
      setAiResult((prev) => ({ ...prev, boq: res.data }));
    } catch {
      setAiError('BOQ generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCostPredict = async () => {
    const baseAmount = aiResult?.boq?.totalAmount || 100000;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await API.post('/ai/cost-predict', { boqTotalAmount: baseAmount, projectType: aiForm.projectType, location: aiForm.location });
      setAiResult((prev) => ({ ...prev, costEstimate: res.data }));
    } catch {
      setAiError('Cost prediction failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRiskAnalyze = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await API.post('/ai/risk-analyze', { ...aiForm, estimatedCost: aiResult?.costEstimate?.recommendedBudget || 0 });
      setAiResult((prev) => ({ ...prev, riskScore: res.data }));
    } catch {
      setAiError('Risk analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GPS Capture
  // ---------------------------------------------------------------------------
  const handleGPSCapture = () => {
    if (!navigator.geolocation) {
      setGpsStatus('❌ Geolocation not supported by this browser');
      return;
    }
    setGpsStatus('📡 Acquiring GPS signal...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, altitude, accuracy } = pos.coords;
        setGpsStatus(`✅ GPS captured: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
      },
      (err) => {
        setGpsStatus(`❌ GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) return <div className="loading">Loading AI Surveyor Dashboard...</div>;

  const pendingFunding = fundingRequests.filter((r) => r.status === 'pending').length;
  const approvedFunding = fundingRequests.filter((r) => r.status === 'approved').length;

  return (
    <div style={{ color: '#e6edf3' }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>🧠 AI Surveyor Dashboard</h1>
          <div style={{ color: '#8b949e', fontSize: '0.85rem', marginTop: '4px' }}>Enterprise Intelligence Mode · {user?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/sites/new" className="btn btn-primary btn-sm">+ New Site</Link>
          <Link to="/projects/new" className="btn btn-secondary btn-sm">+ Project</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'My Workers', value: workers.length, icon: '👷', color: '#e65100' },
          { label: 'Pending Funding', value: pendingFunding, icon: '⏳', color: '#f57c00' },
          { label: 'Approved Funding', value: approvedFunding, icon: '✅', color: '#2e7d32' },
          { label: 'Material Requests', value: materialRequests.length, icon: '🔧', color: '#6a1b9a' },
          { label: 'Projects', value: projects.length, icon: '🏗️', color: '#1565c0' },
          { label: 'Sites Registered', value: sites.length, icon: '📍', color: '#00796b' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '16px' }}>
            <div style={{ fontSize: '1.6rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Map + AI Control Panel (side by side on larger screens) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* 📍 Site Map */}
        <div>
          <SiteMapPanel sites={sites} onCapture={handleGPSCapture} />
          {gpsStatus && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: gpsStatus.startsWith('✅') ? '#3fb950' : gpsStatus.startsWith('📡') ? '#ffa657' : '#f85149' }}>{gpsStatus}</div>}
        </div>

        {/* 🧠 AI Control Panel */}
        <div className="card" style={{ background: '#0d1117', border: '1px solid #30363d' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '14px' }}>🧠 AI Analysis Controls</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Project Type</label>
              <select value={aiForm.projectType} onChange={(e) => setAiForm({ ...aiForm, projectType: e.target.value })} style={{ width: '100%', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 8px', fontSize: '0.85rem' }}>
                {['residential', 'commercial', 'industrial', 'infrastructure', 'road', 'bridge'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Area (m²)</label>
              <input type="number" value={aiForm.area} onChange={(e) => setAiForm({ ...aiForm, area: Number(e.target.value) })} style={{ width: '100%', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 8px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Terrain</label>
              <select value={aiForm.terrain} onChange={(e) => setAiForm({ ...aiForm, terrain: e.target.value })} style={{ width: '100%', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 8px', fontSize: '0.85rem' }}>
                {['flat', 'sloped', 'hilly', 'mountainous'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Location</label>
              <select value={aiForm.location} onChange={(e) => setAiForm({ ...aiForm, location: e.target.value })} style={{ width: '100%', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 8px', fontSize: '0.85rem' }}>
                {['urban', 'suburban', 'rural', 'remote'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {aiError && <div style={{ color: '#f85149', fontSize: '0.8rem', marginBottom: '10px' }}>{aiError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={handleAIAnalyze} disabled={aiLoading} style={{ background: '#1f6feb', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
              {aiLoading ? '⏳ Analyzing...' : '🚀 Full Analysis'}
            </button>
            <button onClick={handleGenerateBOQ} disabled={aiLoading} style={{ background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
              📋 Generate BOQ
            </button>
            <button onClick={handleCostPredict} disabled={aiLoading} style={{ background: '#9e6a03', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
              💰 Predict Cost
            </button>
            <button onClick={handleRiskAnalyze} disabled={aiLoading} style={{ background: '#b62324', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
              ⚠️ Analyze Risk
            </button>
          </div>
        </div>
      </div>

      {/* AI Insight Cards */}
      {aiResult && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px', color: '#58a6ff' }}>📊 AI Analysis Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {aiResult.costEstimate && (
              <>
                <InsightCard label="Recommended Budget" value={`K${aiResult.costEstimate.recommendedBudget?.toLocaleString()}`} icon="💰" color="#ffa657" sub={`Range: K${aiResult.costEstimate.minEstimate?.toLocaleString()} – K${aiResult.costEstimate.maxEstimate?.toLocaleString()}`} />
                <InsightCard label="Budget Risk" value={aiResult.costEstimate.budgetRisk?.toUpperCase()} icon="📈" color={aiResult.costEstimate.budgetRisk === 'low' ? '#3fb950' : aiResult.costEstimate.budgetRisk === 'medium' ? '#ffa657' : '#f85149'} />
              </>
            )}
            {aiResult.riskScore && (
              <>
                <InsightCard label="Risk Score" value={`${aiResult.riskScore.riskScore}/100`} icon="⚠️" color={aiResult.riskScore.riskLevel === 'low' ? '#3fb950' : aiResult.riskScore.riskLevel === 'medium' ? '#ffa657' : '#f85149'} sub={<RiskBadge level={aiResult.riskScore.riskLevel} />} />
              </>
            )}
            {aiResult.progressEstimate && (
              <InsightCard label="Progress Estimate" value={`${aiResult.progressEstimate.overallProgress}%`} icon="📊" color="#58a6ff" sub={aiResult.progressEstimate.delayRisk !== 'on-track' ? `⚠️ ${aiResult.progressEstimate.delayRisk}` : '✅ On Track'} />
            )}
            {aiResult.confidence !== undefined && (
              <InsightCard label="AI Confidence" value={`${Math.round((aiResult.confidence || aiResult.boq?.confidence || 0) * 100)}%`} icon="🎯" color="#d2a8ff" />
            )}
          </div>

          {/* Risk Alerts */}
          {aiResult.riskScore?.alerts?.length > 0 && (
            <div className="card" style={{ background: '#0d1117', border: '1px solid #30363d' }}>
              <h4 style={{ color: '#f85149', marginBottom: '10px' }}>⚠️ Risk Alerts</h4>
              {aiResult.riskScore.alerts.map((alert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: i < aiResult.riskScore.alerts.length - 1 ? '1px solid #21262d' : 'none' }}>
                  <RiskBadge level={alert.severity} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e6edf3' }}>{alert.category}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generated BOQ */}
          {aiResult.boq?.items?.length > 0 && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>📋 AI-Generated BOQ Preview</h4>
                <Link to="/boq/new" className="btn btn-primary btn-sm">Save as BOQ</Link>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Description</th><th>Unit</th><th>Qty</th><th>Rate (ZMW)</th><th>Amount (ZMW)</th></tr></thead>
                  <tbody>
                    {aiResult.boq.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td>{item.unit}</td>
                        <td>{item.quantity}</td>
                        <td>K{item.unitRate?.toLocaleString()}</td>
                        <td><strong>K{item.amount?.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: '700', background: '#f5f5f5' }}>
                      <td colSpan={4}>TOTAL</td>
                      <td>K{aiResult.boq.totalAmount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '👷', label: 'Enroll Worker', to: '/workers/new', color: '#e65100' },
          { icon: '👥', label: 'View Workers', to: '/workers', color: '#e65100' },
          { icon: '💰', label: 'Request Funding', to: '/funding-requests/new', color: '#1565c0' },
          { icon: '🏗️', label: 'Create Project', to: '/projects/new', color: '#2e7d32' },
          { icon: '🔧', label: 'Request Materials', to: '/procurement/new', color: '#6a1b9a' },
          { icon: '📁', label: 'View Projects', to: '/projects', color: '#2e7d32' },
          { icon: '📋', label: 'BOQ', to: '/boq', color: '#00796b' },
          { icon: '📍', label: 'My Sites', to: '/sites', color: '#00796b' },
        ].map(({ icon, label, to, color }) => (
          <Link key={to + label} to={to} className="card" style={{ textDecoration: 'none', color, textAlign: 'center', padding: '14px', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginTop: '6px' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Workers Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>👷 My Enrolled Workers</h3>
          <Link to="/workers/new" className="btn btn-primary btn-sm">+ Enroll</Link>
        </div>
        {workers.length === 0 ? (
          <div className="empty-state">No workers enrolled yet. <Link to="/workers/new">Enroll a worker</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Full Name</th><th>NRC</th><th>Phone</th><th>Daily Rate</th><th>Site</th><th>Date</th></tr></thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td><td>{w.nrc}</td><td>{w.phone}</td>
                    <td>K{w.dailyRate}</td><td>{w.site}</td>
                    <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects Table */}
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
              <thead><tr><th>Project Name</th><th>Location</th><th>Status</th><th>Date</th></tr></thead>
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

      {/* Funding Requests */}
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
              <thead><tr><th>Date</th><th>Title</th><th>Amount (ZMW)</th><th>Site</th><th>Status</th></tr></thead>
              <tbody>
                {fundingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.title}</td>
                    <td>K{req.amount?.toLocaleString()}</td>
                    <td>{req.site || '—'}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
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
          <h3>🔧 My Material Requests</h3>
          <Link to="/procurement/new" className="btn btn-primary btn-sm">+ New Request</Link>
        </div>
        {materialRequests.length === 0 ? (
          <div className="empty-state">No material requests yet. <Link to="/procurement/new">Make a request</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Supplier</th><th>Status</th></tr></thead>
              <tbody>
                {materialRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.itemName}</td><td>{req.quantity}</td>
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

export default AISurveyorDashboard;
