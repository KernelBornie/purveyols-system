import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert,
  FormControlLabel, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, Skeleton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../context/AuthContext';

// ─── Simple cache with TTL ──────────────────────────────────
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
  const [stats, setStats] = useState({ workers: 0, projects: 0, totalReleased: 0, fundingRequests: 0 });
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
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

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  // ─── Refresh user data from backend ──────────────────────────
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

  // ─── Fetch all dashboard data ──────────────────────────────
  const fetchDashboardData = useCallback(async (force = false) => {
    const cacheKey = 'accountant_dashboard';
    if (!force) {
      const cached = getCached(cacheKey);
      if (cached) {
        setStats(cached.stats);
        setWorkers(cached.workers);
        setProjects(cached.projects);
        setFundingRequests(cached.fundingRequests);
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
      const [workersRes, attendanceRes, paymentsRes, projectsRes, fundingRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/attendance'),
        api.get('/api/payments'),
        api.get('/api/projects'),
        api.get('/api/funding-requests').catch(() => api.get('/api/funding'))
      ]);

      const workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : (attendanceRes.data?.data || []);
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
      const completedPayments = paymentsData.filter(p => p.status === 'completed');
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []);
      const fundingData = Array.isArray(fundingRes.data) ? fundingRes.data : (fundingRes.data?.data || []);

      // ─── Compute worker balances ──────────────────────────────
      const workersWithBalance = workersData.map(w => {
        const workerAttendance = attendanceData.filter(a => a.worker === w._id || a.worker?._id === w._id);
        const totalEarned = workerAttendance.reduce((sum, a) => sum + (a.rate || 0), 0);
        const workerPayments = completedPayments.filter(p => p.worker === w._id || p.worker?._id === w._id);
        const totalPaid = workerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return { ...w, balance: totalEarned - totalPaid };
      });

      const totalWorkers = workersWithBalance.length;
      const totalProjects = projectsData.length;
      const totalReleased = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalFunding = fundingData.length;

      // ─── Top workers ────────────────────────────────────────────
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

      // ─── Payment trends ────────────────────────────────────────
      const trends = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trends[key] = 0;
      }
      completedPayments.forEach(p => {
        const date = new Date(p.createdAt).toISOString().split('T')[0];
        if (trends[date] !== undefined) trends[date] += p.amount;
      });
      const trendData = Object.entries(trends).map(([date, amount]) => ({ date, amount }));

      // ─── Project spending ──────────────────────────────────────
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

      // ─── Approval ratio ────────────────────────────────────────
      const pending = fundingData.filter(f => f.status === 'pending').length;
      const approved = fundingData.filter(f => f.status === 'approved').length;
      const rejected = fundingData.filter(f => f.status === 'rejected').length;
      const ratio = [
        { name: 'Pending', value: pending },
        { name: 'Approved', value: approved },
        { name: 'Rejected', value: rejected },
      ].filter(item => item.value > 0);

      const report = {
        workersEnrolled: totalWorkers,
        projectsCreated: totalProjects,
        payments: completedPayments.length,
        totalAmountReleased: totalReleased,
      };

      const newStats = { workers: totalWorkers, projects: totalProjects, totalReleased, fundingRequests: totalFunding };
      setStats(newStats);
      setWorkers(workersWithBalance);
      setProjects(projectsData);
      setFundingRequests(fundingData);
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

  // ─── Combined refresh – update user + dashboard ──────────────
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

  // ─── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Worker search / payment modal handlers ───────────────────
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

  // ─── Bulk payment ─────────────────────────────────────────────
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
        Total pending: {formatCurrency(totalPending)} ({pendingWorkers.length} workers) | {pendingFunding} pending funding requests
      </Typography>

      {/* Stats Cards */}
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
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Charts */}
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

      {/* Tables */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Projects by Creator</Typography>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Project</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Budget</TableCell><TableCell>Created By</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {projects.slice(0, 5).map(p => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.location || '—'}</TableCell>
                <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                <TableCell>{formatCurrency(p.budget)}</TableCell>
                <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && <TableRow><TableCell colSpan={5}>No projects</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Enrolled Workers</Typography>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Name</TableCell><TableCell>NRC</TableCell><TableCell>Phone</TableCell><TableCell>Site</TableCell><TableCell>Enrolled By</TableCell><TableCell>Pending</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {workers.slice(0, 5).map(w => (
              <TableRow key={w._id}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.nrc}</TableCell>
                <TableCell>{w.phone}</TableCell>
                <TableCell>{w.site || '—'}</TableCell>
                <TableCell>{w.enrolledBy?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(w.balance || 0)}</TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && <TableRow><TableCell colSpan={6}>No workers</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Funding Requests</Typography>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Project</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Requested By</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {fundingRequests.slice(0, 5).map(fr => (
              <TableRow key={fr._id}>
                <TableCell>{fr.project?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(fr.amount)}</TableCell>
                <TableCell><Chip label={fr.status} color={fr.status === 'approved' ? 'success' : fr.status === 'rejected' ? 'error' : 'warning'} size="small" /></TableCell>
                <TableCell>{fr.requestedBy?.name || 'N/A'}</TableCell>
              </TableRow>
            ))}
            {fundingRequests.length === 0 && <TableRow><TableCell colSpan={4}>No funding requests</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Procurement Orders (Pending Funding)</Typography>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Project</TableCell><TableCell>Items</TableCell><TableCell>Status</TableCell><TableCell>Created By</TableCell></TableRow>
          </TableHead>
          <TableBody>
            <TableRow><TableCell colSpan={4}>No pending procurement orders</TableCell></TableRow>
          </TableBody>
        </Table>
      </Paper>

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

      {/* Payment Modals */}
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
    </Box>
  );
};

export default AccountantDashboard;