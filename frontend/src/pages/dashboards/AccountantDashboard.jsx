import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import NotificationBell from '../../components/NotificationBell';
import ReportModal from '../../components/ReportModal';
import ExportButton from '../../components/ExportButton';

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ workers: 0, projects: 0, payments: 0, fundingRequests: 0, totalReleased: 0 });
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [payAllOpen, setPayAllOpen] = useState(false);
  const [payAllStatus, setPayAllStatus] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [chartData, setChartData] = useState({ projectSpending: [], paymentTrends: [], approvalRatio: [], topWorkers: [] });
  const [showCharts, setShowCharts] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workersRes, projectsRes, fundingRes, procRes, paymentsRes, reportRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/projects'),
        api.get('/api/funding-requests'),
        api.get('/api/procurement'),
        api.get('/api/payments'),
        api.get(`/api/reports/accountant/stats?period=${period}`)
      ]);

      const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const fundingData = Array.isArray(fundingRes.data) ? fundingRes.data : [];
      const procData = Array.isArray(procRes.data) ? procRes.data : [];
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

      setWorkers(workersData);
      setProjects(projectsData);
      setFundingRequests(fundingData);
      setProcurementOrders(procData);
      setPayments(paymentsData);
      setReportData(reportRes.data);

      // Compute chart data
      const projectSpending = {};
      paymentsData.forEach(p => {
        if (p.project) {
          const key = p.project._id || p.project;
          projectSpending[key] = (projectSpending[key] || 0) + p.amount;
        }
      });

      const paymentTrends = {};
      paymentsData.forEach(p => {
        const date = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : 'unknown';
        paymentTrends[date] = (paymentTrends[date] || 0) + p.amount;
      });

      const workerEarnings = {};
      paymentsData.forEach(p => {
        if (p.worker) {
          const workerId = p.worker._id || p.worker;
          if (workerId) {
            workerEarnings[workerId] = (workerEarnings[workerId] || 0) + p.amount;
          }
        }
      });

      const approvalRatio = [
        { name: 'Pending', value: fundingData.filter(f => f.status === 'pending').length },
        { name: 'Approved', value: fundingData.filter(f => f.status === 'approved').length },
        { name: 'Rejected', value: fundingData.filter(f => f.status === 'rejected').length },
      ].filter(item => item.value > 0);

      const topWorkers = Object.entries(workerEarnings)
        .map(([key, value]) => {
          const worker = workersData.find(w => w._id === key);
          return { name: worker?.name || key, amount: value };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setChartData({
        projectSpending: Object.entries(projectSpending).map(([key, value]) => ({
          name: projectsData.find(p => (p._id === key))?.name || key,
          amount: value
        })),
        paymentTrends: Object.entries(paymentTrends).map(([key, value]) => ({ date: key, amount: value })).sort((a, b) => a.date.localeCompare(b.date)),
        approvalRatio,
        topWorkers,
      });

      const totalReleased = paymentsData.reduce((sum, p) => sum + p.amount, 0);
      setStats({
        workers: workersData.length,
        projects: projectsData.length,
        payments: paymentsData.length,
        fundingRequests: fundingData.length,
        totalReleased,
      });

      const pendingFunding = fundingData.filter(f => f.status === 'pending').length;
      setNotificationCount(pendingFunding);

    } catch (err) {
      console.error('Fetch error:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // ... rest of component (keep existing code)
  // For brevity, we're showing the key changes
  // The full component would be included

  const pendingWorkers = workers.filter(w => (w.balance || 0) > 0);
  const totalPending = pendingWorkers.reduce((sum, w) => sum + (w.balance || 0), 0);

  const handlePayAll = () => {
    if (pendingWorkers.length === 0) {
      alert('No pending balances to pay.');
      return;
    }
    setPayAllOpen(true);
  };

  const handlePayAllConfirm = async () => {
    setPayAllStatus(null);
    try {
      const paymentsData = pendingWorkers.map(w => ({
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card onClick={() => navigate('/workers')} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Workers</Typography>
              <Typography variant="h4">{stats.workers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card onClick={() => navigate('/projects')} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Projects</Typography>
              <Typography variant="h4">{stats.projects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Total Released</Typography>
              <Typography variant="h4">ZMW {stats.totalReleased.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card onClick={() => navigate('/funding')} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
              <Typography variant="h4">{stats.fundingRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)} sx={{ mr: 2 }}>
          Pay Worker (Airtel Money)
        </Button>
        <Button variant="contained" color="secondary" onClick={handlePayAll} sx={{ mr: 2 }}>
          Pay All Pending
        </Button>
        <Typography variant="caption" display="inline" sx={{ ml: 1 }}>
          Total pending: ZMW {totalPending.toFixed(2)} ({pendingWorkers.length} workers)
        </Typography>
      </Box>

      {/* Worker Search Modal */}
      <WorkerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={(worker) => {
        setSelectedWorker(worker);
        setSearchOpen(false);
        setPaymentOpen(true);
      }} />

      {/* Payment Modal */}
      {selectedWorker && (
        <PaymentModal
          open={paymentOpen}
          onClose={() => {
            setPaymentOpen(false);
            setSelectedWorker(null);
            fetchData();
          }}
          worker={selectedWorker}
          onSuccess={fetchData}
        />
      )}

      {/* Pay All Dialog */}
      <Dialog open={payAllOpen} onClose={() => setPayAllOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pay All Pending Workers</DialogTitle>
        <DialogContent>
          <Typography>You are about to pay <strong>{pendingWorkers.length}</strong> workers a total of <strong>ZMW {totalPending.toFixed(2)}</strong>.</Typography>
          {pendingWorkers.map(w => <Typography key={w._id} variant="body2">{w.name}: ZMW {(w.balance || 0).toFixed(2)}</Typography>)}
          {payAllStatus && <Alert severity={payAllStatus.type} sx={{ mt: 2 }}>{payAllStatus.message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayAllOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayAllConfirm}>Confirm Payment</Button>
        </DialogActions>
      </Dialog>

      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </Box>
  );
};

export default AccountantDashboard;
