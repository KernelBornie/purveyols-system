import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert,
  FormControlLabel, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, Skeleton, IconButton, Tooltip,
  TextField
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility'; // ✅ added
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../context/AuthContext';

const cache = {};
const CACHE_TTL = 5 * 60 * 1000;

const getCached = (key) => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
};

const setCached = (key, data) => {
  cache[key] = { data, timestamp: Date.now() };
};

const AccountantDashboard = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ workers: 0, projects: 0, totalReleased: 0, fundingRequests: 0, pendingFunding: 0 });
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [subcontracts, setSubcontracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [paymentTrends, setPaymentTrends] = useState([]);
  const [projectSpending, setProjectSpending] = useState([]);
  const [approvalRatio, setApprovalRatio] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showCharts, setShowCharts] = useState(true);
  const [message, setMessage] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [payAllOpen, setPayAllOpen] = useState(false);
  const [payAllStatus, setPayAllStatus] = useState(null);

  // ─── Funding Request Modal ──────────────────────────────────────
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundRequestId, setFundRequestId] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fundAmount, setFundAmount] = useState(0);
  const [fundRequesterName, setFundRequesterName] = useState('');
  const [fundType, setFundType] = useState('funding');

  // ─── Procurement Funding Modal ──────────────────────────────────
  const [procurementFundOpen, setProcurementFundOpen] = useState(false);
  const [procurementToFund, setProcurementToFund] = useState(null);

  // ─── Subcontract Funding Modal ──────────────────────────────────
  const [subcontractFundOpen, setSubcontractFundOpen] = useState(false);
  const [subcontractToFund, setSubcontractToFund] = useState(null);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  const initialLoadDone = useRef(false);

  const canApprove = ['admin', 'director', 'accountant'].includes(user?.role);
  const canFund = ['admin', 'accountant'].includes(user?.role);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.data) {
        updateUser(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
    return null;
  }, [updateUser]);

  const fetchDashboardData = useCallback(async (force = false) => {
    const cacheKey = 'accountant_dashboard';
    if (!force) {
      const cached = getCached(cacheKey);
      if (cached) {
        setStats(cached.stats);
        setWorkers(cached.workers);
        setProjects(cached.projects);
        setFundingRequests(cached.fundingRequests);
        setProcurementOrders(cached.procurementOrders || []);
        setSubcontracts(cached.subcontracts || []);
        setPayments(cached.payments);
        setAttendance(cached.attendance);
        setTopWorkers(cached.topWorkers);
        setPaymentTrends(cached.paymentTrends);
        setProjectSpending(cached.projectSpending);
        setApprovalRatio(cached.approvalRatio);
        setReportData(cached.reportData);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setMessage(null);
    try {
      const [workersRes, attendanceRes, paymentsRes, projectsRes, fundingRes, procurementRes, subcontractsRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/attendance'),
        api.get('/api/payments'),
        api.get('/api/projects'),
        api.get('/api/funding-requests').catch(() => api.get('/api/funding')),
        api.get('/api/procurement'),
        api.get('/api/subcontracts')
      ]);

      const workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : (attendanceRes.data?.data || []);
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
      const completedPayments = paymentsData.filter(p => p.status === 'completed');
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []);
      const fundingData = Array.isArray(fundingRes.data) ? fundingRes.data : (fundingRes.data?.data || []);
      const procurementData = Array.isArray(procurementRes.data) ? procurementRes.data : (procurementRes.data?.data || []);
      const subcontractsData = Array.isArray(subcontractsRes.data) ? subcontractsRes.data : (subcontractsRes.data?.data || []);

      const workersWithBalance = workersData.map(w => {
        const workerAttendance = attendanceData.filter(a => a.worker === w._id || a.worker?._id === w._id);
        const totalEarned = workerAttendance.reduce((sum, a) => sum + (a.days * a.rate || a.rate), 0);
        const workerPayments = completedPayments.filter(p => p.worker === w._id || p.worker?._id === w._id);
        const totalPaid = workerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return { ...w, balance: totalEarned - totalPaid };
      });

      const totalWorkers = workersWithBalance.length;
      const totalProjects = projectsData.length;
      const totalReleased = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalFunding = fundingData.length;
      const pendingFunding = fundingData.filter(f => f.status === 'pending').length;

      const workerEarnings = {};
      completedPayments.forEach(p => {
        const workerId = p.worker?._id || p.worker;
        if (workerId) {
          workerEarnings[workerId] = (workerEarnings[workerId] || 0) + p.amount;
        }
      });
      const top = Object.entries(workerEarnings)
        .map(([id, amount]) => {
          const worker = workersWithBalance.find(w => w._id === id);
          return { name: worker?.name || 'Unknown', amount };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const trends = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (d) {
          const key = d.toISOString().split('T')[0];
          trends[key] = 0;
        }
      }
      completedPayments.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt).toISOString().split('T')[0];
          if (trends[date] !== undefined) trends[date] += p.amount;
        }
      });
      const trendData = Object.entries(trends).map(([date, amount]) => ({ date, amount }));

      const projectSpendingMap = {};
      completedPayments.forEach(p => {
        const projectId = p.project?._id || p.project;
        if (projectId) {
          const project = projectsData.find(pr => pr._id === projectId);
          const name = project?.name || 'Unknown Project';
          projectSpendingMap[name] = (projectSpendingMap[name] || 0) + p.amount;
        }
      });
      const spendingData = Object.entries(projectSpendingMap).map(([name, amount]) => ({ name, amount }));

      const pending = fundingData.filter(f => f.status === 'pending').length;
      const approved = fundingData.filter(f => f.status === 'approved').length;
      const rejected = fundingData.filter(f => f.status === 'rejected').length;
      const funded = fundingData.filter(f => f.status === 'funded').length;
      const ratio = [
        { name: 'Pending', value: pending },
        { name: 'Approved', value: approved },
        { name: 'Rejected', value: rejected },
        { name: 'Funded', value: funded },
      ].filter(item => item.value > 0);

      const report = {
        workersEnrolled: totalWorkers,
        projectsCreated: totalProjects,
        payments: completedPayments.length,
        totalAmountReleased: totalReleased,
      };

      const newStats = { 
        workers: totalWorkers, 
        projects: totalProjects, 
        totalReleased, 
        fundingRequests: totalFunding,
        pendingFunding: pendingFunding
      };
      setStats(newStats);
      setWorkers(workersWithBalance);
      setProjects(projectsData);
      setFundingRequests(fundingData);
      setProcurementOrders(procurementData);
      setSubcontracts(subcontractsData);
      setPayments(completedPayments);
      setAttendance(attendanceData);
      setTopWorkers(top);
      setPaymentTrends(trendData);
      setProjectSpending(spendingData);
      setApprovalRatio(ratio);
      setReportData(report);

      setCached(cacheKey, {
        stats: newStats,
        workers: workersWithBalance,
        projects: projectsData,
        fundingRequests: fundingData,
        procurementOrders: procurementData,
        subcontracts: subcontractsData,
        payments: completedPayments,
        attendance: attendanceData,
        topWorkers: top,
        paymentTrends: trendData,
        projectSpending: spendingData,
        approvalRatio: ratio,
        reportData: report,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setMessage({ type: 'error', text: 'Failed to load data. Check console.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await fetchDashboardData(true);
      setMessage({ type: 'success', text: 'Data refreshed successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Refresh failed' });
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, fetchDashboardData]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshAll();
    }
  }, []);

  // ─── Funding request handlers ────────────────────────────────────
  const handleApproveFunding = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/approve`);
      setMessage({ type: 'success', text: 'Funding request approved!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  const handleRejectFunding = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/funding-requests/${id}/reject`, { reason });
      setMessage({ type: 'success', text: 'Funding request rejected.' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Rejection failed' });
    }
  };

  const handleForwardFunding = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/forward`);
      setMessage({ type: 'success', text: 'Funding request forwarded to Director!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Forward failed' });
    }
  };

  // ─── Procurement handlers ──────────────────────────────────────
  const handleFinalApproveProcurement = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/final-approve`);
      setMessage({ type: 'success', text: 'Order final approved!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Final approval failed' });
    }
  };

  // ─── Funding handlers ──────────────────────────────────────────
  const handleFundProcurement = async (id, recipientPhone) => {
    try {
      await api.put(`/api/procurement/${id}/fund`, { recipientPhone });
      setMessage({ type: 'success', text: 'Procurement order funded!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    }
  };

  const handleFundSubcontract = async (id, recipientPhone) => {
    try {
      await api.put(`/api/subcontracts/${id}/fund`, { recipientPhone });
      setMessage({ type: 'success', text: 'Subcontract funded!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    }
  };

  // ─── Existing handlers ──────────────────────────────────────────
  const handleFundClick = (request) => {
    const requester = request.requestedBy;
    setFundRequestId(request._id);
    setFundAmount(request.amount);
    setFundRequesterName(requester?.name || 'Unknown');
    setRecipientPhone(requester?.mobileMoneyNumber || requester?.phone || '');
    setFundType('funding');
    setFundModalOpen(true);
  };

  const handleFundConfirm = async () => {
    if (!recipientPhone || recipientPhone.trim() === '') {
      alert('Please enter the recipient\'s phone number.');
      return;
    }
    try {
      await api.put(`/api/funding-requests/${fundRequestId}/fund`, { recipientPhone });
      setFundModalOpen(false);
      refreshAll();
    } catch (err) {
      alert('Funding failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleWorkerSelect = useCallback((worker) => {
    setSelectedWorker(worker);
    setSearchOpen(false);
    setPaymentOpen(true);
  }, []);

  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    setSelectedWorker(null);
    refreshAll();
  }, [refreshAll]);

  const handlePayAll = useCallback(() => {
    if (!user?.mobileMoneyNumber) {
      alert('Please set your mobile money number in your profile first.');
      return;
    }
    const pending = workers.filter(w => (w.balance || 0) > 0);
    if (pending.length === 0) {
      alert('No pending balances to pay.');
      return;
    }
    setPayAllOpen(true);
  }, [workers, user]);

  const handlePayAllConfirm = useCallback(async () => {
    setPayAllStatus(null);
    if (!user?.mobileMoneyNumber) {
      alert('Please set your mobile money number in your profile first.');
      return;
    }
    const pending = workers.filter(w => (w.balance || 0) > 0);
    try {
      const paymentsData = pending.map(w => ({
        workerId: w._id,
        amount: w.balance || 0,
      }));
      await api.post('/api/payments/bulk', { payments: paymentsData });
      setPayAllStatus({ type: 'success', message: 'All pending payments processed!' });
      setTimeout(() => {
        setPayAllOpen(false);
        setPayAllStatus(null);
        refreshAll();
      }, 1500);
    } catch (err) {
      setPayAllStatus({ type: 'error', message: err.response?.data?.error || 'Bulk payment failed' });
    }
  }, [workers, refreshAll, user]);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  }, []);

  const pendingWorkers = useMemo(() => workers.filter(w => (w.balance || 0) > 0), [workers]);
  const totalPending = useMemo(() => pendingWorkers.reduce((sum, w) => sum + (w.balance || 0), 0), [pendingWorkers]);
  const pendingFunding = useMemo(() => fundingRequests.filter(f => f.status === 'pending').length, [fundingRequests]);

  const workersByProject = useMemo(() => {
    const groups = {};
    workers.forEach(w => {
      const projectId = w.project?._id || w.project;
      if (projectId) {
        const project = projects.find(p => p._id === projectId);
        const key = projectId.toString();
        if (!groups[key]) {
          groups[key] = { projectName: project?.name || 'Unknown Project', workers: [] };
        }
        groups[key].workers.push(w);
      } else {
        if (!groups['unassigned']) {
          groups['unassigned'] = { projectName: 'Unassigned', workers: [] };
        }
        groups['unassigned'].workers.push(w);
      }
    });
    return groups;
  }, [workers, projects]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4"><Skeleton width={300} /></Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[1,2,3,4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card><CardContent><Skeleton variant="text" /><Skeleton variant="text" width="60%" /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />}
            label="Show Charts"
          />
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={refreshAll}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button component={Link} to="/projects" variant="contained" fullWidth startIcon={<VisibilityIcon />}>
              View Projects
            </Button>
            <Typography variant="caption" color="textSecondary">See all projects</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button component={Link} to="/workers" variant="contained" fullWidth startIcon={<VisibilityIcon />}>
              View Workers
            </Button>
            <Typography variant="caption" color="textSecondary">See all enrolled workers</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button component={Link} to="/funding" variant="contained" fullWidth startIcon={<VisibilityIcon />}>
              Funding Requests
            </Button>
            <Typography variant="caption" color="textSecondary">Manage funding requests</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button component={Link} to="/procurement" variant="contained" fullWidth startIcon={<VisibilityIcon />}>
              Procurement Orders
            </Button>
            <Typography variant="caption" color="textSecondary">View requisition notes</Typography>
          </Grid>
        </Grid>
      </Paper>

      <DeliveryNote />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)}>
          Pay Worker (Airtel Money)
        </Button>
        <Button variant="contained" color="secondary" onClick={handlePayAll}>
          Pay All Pending
        </Button>
        {!user?.mobileMoneyNumber && (
          <Alert severity="warning" sx={{ ml: 2 }}>
            Accountant mobile money number not set.
            <Button size="small" color="inherit" href="/profile" sx={{ ml: 1 }}>
              Update Profile
            </Button>
          </Alert>
        )}
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 2 }}>
        Total pending: {formatCurrency(totalPending)} ({pendingWorkers.length} workers) | {stats.pendingFunding} pending funding requests
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Workers</Typography>
            <Typography variant="h4">{stats.workers}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Projects</Typography>
            <Typography variant="h4">{stats.projects}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Total Released</Typography>
            <Typography variant="h4">{formatCurrency(stats.totalReleased)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
            <Typography variant="h4">{stats.fundingRequests}</Typography>
            <Typography variant="caption" color="textSecondary">{stats.pendingFunding} pending</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {showCharts && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {paymentTrends.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Payment Trends</Typography>
                <LineChart width={400} height={200} data={paymentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                </LineChart>
              </Paper>
            </Grid>
          )}
          {projectSpending.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Spending by Project</Typography>
                <BarChart width={400} height={200} data={projectSpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </Paper>
            </Grid>
          )}
          {approvalRatio.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Funding Approval Ratio</Typography>
                <PieChart width={300} height={200}>
                  <Pie data={approvalRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {approvalRatio.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </Paper>
            </Grid>
          )}
          {topWorkers.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Top Workers (Earnings)</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Worker</TableCell><TableCell>Total Earned</TableCell></TableRow></TableHead>
                  <TableBody>
                    {topWorkers.map(w => (
                      <TableRow key={w.name}>
                        <TableCell>{w.name}</TableCell>
                        <TableCell>{formatCurrency(w.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Projects Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Projects by Creator</Typography>
          <Button component={Link} to="/projects" size="small">View All</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.slice(0, 5).map(p => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.location || '—'}</TableCell>
                <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                <TableCell>{formatCurrency(p.budget)}</TableCell>
                <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/projects/${p._id}`} size="small" variant="outlined">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Workers by Project */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Workers by Project</Typography>
          <Button component={Link} to="/workers" size="small">View All</Button>
        </Box>
        {Object.entries(workersByProject).length === 0 ? (
          <Typography variant="body2" color="textSecondary">No workers enrolled.</Typography>
        ) : (
          Object.entries(workersByProject).map(([key, group]) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>
                {group.projectName} ({group.workers.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>NRC</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Enrolled By</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.workers.map(w => (
                    <TableRow key={w._id}>
                      <TableCell>{w.name}</TableCell>
                      <TableCell>{w.nrc}</TableCell>
                      <TableCell>{w.phone}</TableCell>
                      <TableCell>{w.site || '—'}</TableCell>
                      <TableCell>{w.enrolledBy?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(w.balance || 0)}</TableCell>
                      <TableCell>
                        <Button component={Link} to={`/workers/${w._id}`} size="small" variant="outlined">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))
        )}
      </Paper>

      {/* ─── Funding Requests Table ────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Funding Requests</Typography>
          <Button component={Link} to="/funding" size="small">View All</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fundingRequests.slice(0, 5).map(fr => (
              <TableRow key={fr._id}>
                <TableCell>{fr.project?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(fr.amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={fr.status}
                    color={fr.status === 'funded' ? 'info' : fr.status === 'approved' ? 'success' : fr.status === 'rejected' ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{fr.requestedBy?.name || 'N/A'}</TableCell>
                <TableCell>
                  {fr.status === 'pending' && canApprove && (
                    <>
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        onClick={() => handleForwardFunding(fr._id)}
                        sx={{ mr: 1 }}
                      >
                        Forward
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveFunding(fr._id)}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleRejectFunding(fr._id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {fr.status === 'approved' && canFund && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<AttachMoneyIcon />}
                      onClick={() => handleFundClick(fr)}
                      sx={{ mr: 1 }}
                    >
                      Fund
                    </Button>
                  )}
                  <Button component={Link} to={`/funding/${fr._id}`} size="small" variant="outlined">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Procurement Orders Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Procurement Orders (Pending Funding)</Typography>
          <Button component={Link} to="/procurement" size="small">View All</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {procurementOrders.slice(0, 5).map(o => (
              <TableRow key={o._id}>
                <TableCell>{o.project?.name}</TableCell>
                <TableCell>{o.items?.length || 0}</TableCell>
                <TableCell><Chip label={o.status} color={o.status === 'funded' ? 'success' : o.status === 'procurement_approved' ? 'info' : 'warning'} size="small" /></TableCell>
                <TableCell>{o.createdBy?.name}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/procurement/${o._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                    View
                  </Button>
                  {o.status === 'procurement_approved' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleFinalApproveProcurement(o._id)}
                      sx={{ mr: 1 }}
                    >
                      FINAL APPROVE
                    </Button>
                  )}
                  {o.status === 'approved' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<AttachMoneyIcon />}
                      onClick={() => {
                        setProcurementToFund(o);
                        setProcurementFundOpen(true);
                      }}
                    >
                      Fund
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Subcontracts Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Subcontracts (Pending Funding)</Typography>
          <Button component={Link} to="/subcontracts" size="small">View All</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Contractor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subcontracts.slice(0, 5).map(s => (
              <TableRow key={s._id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.project?.name || 'N/A'}</TableCell>
                <TableCell>{s.contractor?.name || s.contractor || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(s.amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={s.status}
                    color={s.status === 'funded' ? 'success' : s.status === 'approved' ? 'info' : s.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button component={Link} to={`/subcontracts/${s._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                    View
                  </Button>
                  {s.status !== 'completed' && s.status !== 'terminated' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<AttachMoneyIcon />}
                      onClick={() => {
                        setSubcontractToFund(s);
                        setSubcontractFundOpen(true);
                      }}
                    >
                      Fund
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {subcontracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">No subcontracts found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Weekly Report */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Weekly Report</Typography>
        {reportData ? (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><Typography variant="body2">Workers Enrolled</Typography><Typography variant="h6">{reportData.workersEnrolled}</Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Projects Created</Typography><Typography variant="h6">{reportData.projectsCreated}</Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Payments Made</Typography><Typography variant="h6">{reportData.payments}</Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Total Released</Typography><Typography variant="h6">{formatCurrency(reportData.totalAmountReleased)}</Typography></Grid>
          </Grid>
        ) : <Typography>No report data.</Typography>}
      </Paper>

      <WorkerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleWorkerSelect} />
      {selectedWorker && (
        <PaymentModal open={paymentOpen} onClose={handlePaymentClose} worker={selectedWorker} onSuccess={refreshAll} />
      )}

      <Dialog open={payAllOpen} onClose={() => setPayAllOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pay All Pending Workers</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to pay <strong>{pendingWorkers.length}</strong> workers a total of <strong>{formatCurrency(totalPending)}</strong>.
          </Typography>
          {pendingWorkers.map(w => (
            <Typography key={w._id} variant="body2">{w.name}: {formatCurrency(w.balance)}</Typography>
          ))}
          {payAllStatus && <Alert severity={payAllStatus.type} sx={{ mt: 2 }}>{payAllStatus.message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayAllOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayAllConfirm}>Confirm Payment</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Funding Request Modal ───────────────────────────────────── */}
      <Dialog open={fundModalOpen} onClose={() => setFundModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fund Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to fund <strong>{fundRequesterName}</strong> for <strong>{formatCurrency(fundAmount)}</strong>.
          </Typography>
          <TextField
            label="Recipient Phone Number (Airtel Money)"
            fullWidth
            margin="normal"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="e.g., 0971234567"
            helperText="This is the phone number that will receive the funds."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleFundConfirm}>
            Confirm & Send Money
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Procurement Funding Modal ────────────────────────────────── */}
      <Dialog open={procurementFundOpen} onClose={() => setProcurementFundOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fund Procurement Order</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to fund procurement order <strong>{procurementToFund?.orderNumber || procurementToFund?._id?.slice(-6)}</strong> for <strong>{formatCurrency(procurementToFund?.grandTotal || procurementToFund?.total || 0)}</strong>.
          </Typography>
          <TextField
            label="Recipient Phone Number (Airtel Money)"
            fullWidth
            margin="normal"
            value={procurementToFund?.recipientPhone || ''}
            onChange={(e) => setProcurementToFund({ ...procurementToFund, recipientPhone: e.target.value })}
            placeholder="e.g., 0971234567"
            helperText="This is the phone number that will receive the funds."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcurementFundOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!procurementToFund?.recipientPhone) {
                alert('Please enter the recipient\'s phone number.');
                return;
              }
              await handleFundProcurement(procurementToFund._id, procurementToFund.recipientPhone);
              setProcurementFundOpen(false);
            }}
          >
            Confirm & Send Money
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Subcontract Funding Modal ─────────────────────────────────── */}
      <Dialog open={subcontractFundOpen} onClose={() => setSubcontractFundOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fund Subcontract</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to fund <strong>{subcontractToFund?.vendor}</strong> for <strong>{formatCurrency(subcontractToFund?.amount)}</strong>.
          </Typography>
          <TextField
            label="Vendor Phone (Airtel Money)"
            fullWidth
            margin="normal"
            value={subcontractToFund?.vendorPhone || ''}
            onChange={(e) => setSubcontractToFund({ ...subcontractToFund, vendorPhone: e.target.value })}
            placeholder="e.g., 0971234567"
            helperText="This is the phone number that will receive the funds."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubcontractFundOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!subcontractToFund?.vendorPhone) {
                alert('Please enter the vendor\'s phone number.');
                return;
              }
              await handleFundSubcontract(subcontractToFund._id, subcontractToFund.vendorPhone);
              setSubcontractFundOpen(false);
            }}
          >
            Confirm & Send Money
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountantDashboard;