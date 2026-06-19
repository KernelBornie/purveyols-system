cd ~/Desktop/purveyols-system

cat > frontend/src/pages/dashboards/AccountantDashboard.jsx <<'EOF'
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, TextField,
  FormControlLabel, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';

const AccountantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    workers: 0,
    projects: 0,
    totalReleased: 0,
    fundingRequests: 0,
  });
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
  const [airtelStatus, setAirtelStatus] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');

  // New states for Pay Worker & Pay All
  const [searchOpen, setSearchOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [payAllOpen, setPayAllOpen] = useState(false);
  const [payAllStatus, setPayAllStatus] = useState(null);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data && res.data.phone) setWorkerPhone(res.data.phone);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const workersRes = await api.get('/api/workers');
      let workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      
      const attendanceRes = await api.get('/api/attendance');
      let attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : (attendanceRes.data?.data || []);
      setAttendance(attendanceData);

      const paymentsRes = await api.get('/api/payments');
      let paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
      const completedPayments = paymentsData.filter(p => p.status === 'completed');
      setPayments(completedPayments);

      const workersWithBalance = workersData.map(w => {
        const workerAttendance = attendanceData.filter(a => a.worker === w._id || a.worker?._id === w._id);
        const totalEarned = workerAttendance.reduce((sum, a) => sum + (a.rate || 0), 0);
        const workerPayments = completedPayments.filter(p => p.worker === w._id || p.worker?._id === w._id);
        const totalPaid = workerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return { ...w, balance: totalEarned - totalPaid };
      });
      setWorkers(workersWithBalance);

      const projectsRes = await api.get('/api/projects');
      let projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []);
      setProjects(projectsData);

      let fundingData = [];
      try {
        const fundRes = await api.get('/api/funding-requests');
        fundingData = Array.isArray(fundRes.data) ? fundRes.data : (fundRes.data?.data || []);
      } catch (e) {
        const fundRes2 = await api.get('/api/funding');
        fundingData = Array.isArray(fundRes2.data) ? fundRes2.data : (fundRes2.data?.data || []);
      }
      setFundingRequests(fundingData);

      const totalWorkers = workersWithBalance.length;
      const totalProjects = projectsData.length;
      const totalReleased = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalFunding = fundingData.length;

      setStats({
        workers: totalWorkers,
        projects: totalProjects,
        totalReleased,
        fundingRequests: totalFunding,
      });

      // Top workers
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
      setTopWorkers(top);

      // Trends
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
      setPaymentTrends(trendData);

      // Spending
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
      setProjectSpending(spendingData);

      // Approval ratio
      const pending = fundingData.filter(f => f.status === 'pending').length;
      const approved = fundingData.filter(f => f.status === 'approved').length;
      const rejected = fundingData.filter(f => f.status === 'rejected').length;
      const ratio = [
        { name: 'Pending', value: pending },
        { name: 'Approved', value: approved },
        { name: 'Rejected', value: rejected },
      ].filter(item => item.value > 0);
      setApprovalRatio(ratio);

      setReportData({
        workersEnrolled: totalWorkers,
        projectsCreated: totalProjects,
        payments: completedPayments.length,
        totalAmountReleased: totalReleased,
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setMessage({ type: 'error', text: 'Failed to load data. Check console.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProfile();
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleAirtelPay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    if (!workerPhone) {
      alert('Your phone number is not set in your profile.');
      return;
    }
    setAirtelStatus({ type: 'info', text: 'Initiating Airtel Money request...' });
    try {
      const res = await api.post('/api/airtel/ussd', {
        amount: parseFloat(payAmount),
        phoneNumber: workerPhone,
        reference: 'PAY-' + Date.now(),
      });
      setAirtelStatus({
        type: 'success',
        text: `📱 Airtel Money USSD prompt sent to ${workerPhone}. Ref: ${res.data.reference || 'N/A'}`
      });
    } catch (err) {
      setAirtelStatus({
        type: 'error',
        text: err.response?.data?.error || 'Failed to send USSD. Check backend.'
      });
    }
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setSearchOpen(false);
    setPaymentOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedWorker(null);
    fetchData();
  };

  const handlePayAll = () => {
    const pending = workers.filter(w => (w.balance || 0) > 0);
    if (pending.length === 0) {
      alert('No pending balances to pay.');
      return;
    }
    setPayAllOpen(true);
  };

  const handlePayAllConfirm = async () => {
    setPayAllStatus(null);
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
        fetchData();
      }, 1500);
    } catch (err) {
      setPayAllStatus({ type: 'error', message: err.response?.data?.error || 'Bulk payment failed' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const pendingWorkers = workers.filter(w => (w.balance || 0) > 0);
  const totalPending = pendingWorkers.reduce((sum, w) => sum + (w.balance || 0), 0);
  const pendingFunding = fundingRequests.filter(f => f.status === 'pending').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />}
            label="Show Charts"
          />
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
            Refresh
          </Button>
        </Box>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)}>
          Pay Worker (Airtel Money)
        </Button>
        <Button variant="contained" color="secondary" onClick={handlePayAll}>
          Pay All Pending
        </Button>
        {/* additional buttons can go here */}
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 2 }}>
        Total pending: {formatCurrency(totalPending)} ({pendingWorkers.length} workers) | {pendingFunding} pending funding requests
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
          </CardContent></Card>
        </Grid>
      </Grid>

      {loading ? <CircularProgress /> : (
        <>
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

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Pay Worker via Airtel Money</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Amount (ZMW)"
                type="number"
                size="small"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ width: 150 }}
              />
              <Button variant="contained" onClick={handleAirtelPay}>
                Initiate
              </Button>
            </Box>
            {airtelStatus && (
              <Alert severity={airtelStatus.type} sx={{ mt: 2 }}>
                {airtelStatus.text}
              </Alert>
            )}
          </Paper>
        </>
      )}

      {/* Modals for Pay Worker & Pay All */}
      <WorkerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleWorkerSelect} />
      {selectedWorker && (
        <PaymentModal open={paymentOpen} onClose={handlePaymentClose} worker={selectedWorker} onSuccess={fetchData} />
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
EOF
