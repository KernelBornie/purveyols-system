import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
import Footer from '../../components/Footer';
import Footer from '../../components/Footer';
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Divider
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import NotificationBell from '../../components/NotificationBell';
import ReportModal from '../../components/ReportModal';
import ExportButton from '../../components/ExportButton';
import Footer from '../../components/Footer';

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
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [totalPending, setTotalPending] = useState(0);

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

      const pending = workersData.filter(w => (w.balance || 0) > 0);
      setPendingWorkers(pending);
      setTotalPending(pending.reduce((sum, w) => sum + (w.balance || 0), 0));

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

  const handleApproveFunding = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/approve`);
      fetchData();
    } catch (err) { alert('Approval failed'); }
  };

  const handleRejectFunding = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/funding-requests/${id}/reject`, { reason });
      fetchData();
    } catch (err) { alert('Rejection failed'); }
  };

  const handleFundProcurement = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/fund`);
      fetchData();
    } catch (err) { alert('Failed to fund order'); }
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

  const exportCSV = () => {
    const headers = ['Name', 'NRC', 'Phone', 'Site', 'Enrolled By', 'Balance'];
    const rows = workers.map(w => [
      w.name, w.nrc, w.phone || '', w.site || '',
      w.enrolledBy?.name || 'N/A', (w.balance || 0).toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    alert('PDF export coming soon – you can use browser print (Ctrl+P) to save as PDF.');
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  const statCards = [
    { label: 'Workers', value: stats.workers, path: '/workers', color: 'primary' },
    { label: 'Projects', value: stats.projects, path: '/projects', color: 'secondary' },
    { label: 'Total Released', value: `ZMW ${stats.totalReleased.toFixed(2)}`, path: '/payments', color: 'success' },
    { label: 'Funding Requests', value: stats.fundingRequests, path: '/funding', color: 'warning' },
  ];

  const fundingChartData = fundingRequests.map(fr => ({
    name: fr.project?.name || 'N/A',
    requested: fr.amount,
    approved: fr.status === 'approved' ? fr.amount : 0,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <NotificationBell />
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
            Refresh
          </Button>
      <Footer /><Footer />

        </Box>
      <Footer />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)}>
          Pay Worker (Airtel Money)
        </Button>
        <Button variant="contained" color="secondary" onClick={handlePayAll}>
          Pay All Pending
        </Button>
        <Button variant="outlined" onClick={() => setReportModalOpen(true)} startIcon={<DescriptionIcon />}>
          Generate Report
        </Button>
        <ExportButton onExportCSV={exportCSV} onExportPDF={exportPDF} />
        <Button variant="outlined" onClick={() => setPeriod(period === 'week' ? 'month' : 'week')}>
          Switch to {period === 'week' ? 'Monthly' : 'Weekly'} Report
        </Button>
        <FormControlLabel
          control={<Switch checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />}
          label="Show Charts"
        />
      <Footer />
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 2 }}>
        Total pending: ZMW {totalPending.toFixed(2)} ({pendingWorkers.length} workers)
        {notificationCount > 0 && ` | ${notificationCount} pending funding requests`}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6, transform: 'scale(1.02)' }, transition: 'all 0.2s' }} onClick={() => navigate(card.path)}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">{card.label}</Typography>
                <Typography variant="h4">{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading ? <CircularProgress /> : (
        <>
          {showCharts && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {chartData.paymentTrends.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper className="dashboard-background" sx={{ p: 2 }}>
                    <Typography variant="h6">Payment Trends</Typography>
                    <LineChart width={400} height={200} data={chartData.paymentTrends.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                    </LineChart><Footer />

                  </Paper>
                </Grid>
              )}
              {chartData.approvalRatio.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Funding Approval Ratio</Typography>
                    <PieChart width={300} height={200}>
                      <Pie data={chartData.approvalRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.approvalRatio.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </Paper>
                </Grid>
              )}
              {chartData.topWorkers.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Top Workers (Earnings)</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow><TableCell>Worker</TableCell><TableCell>Total Earned</TableCell></TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.topWorkers.map(w => (
                          <TableRow key={w.name}><TableCell>{w.name}</TableCell><TableCell>ZMW {w.amount.toFixed(2)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Projects by Creator</Typography>
              <Button size="small" onClick={() => navigate('/projects')}>View All</Button>
      <Footer />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Budget</TableCell><TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell><Chip label={p.status} size="small" /></TableCell>
                    <TableCell>{p.budget}</TableCell>
                    <TableCell>{p.createdBy ? `${p.createdBy.name} (${p.createdBy.role})` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Enrolled Workers</Typography>
              <Button size="small" onClick={() => navigate('/workers')}>View All</Button>
      <Footer />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>NRC</TableCell><TableCell>Phone</TableCell><TableCell>Site</TableCell>
                  <TableCell>Enrolled By</TableCell><TableCell>Pending</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.slice(0, 5).map(w => (
                  <TableRow key={w._id}>
                    <TableCell>{w.name}</TableCell>
                    <TableCell>{w.nrc}</TableCell>
                    <TableCell>{w.phone}</TableCell>
                    <TableCell>{w.site}</TableCell>
                    <TableCell>{w.enrolledBy ? `${w.enrolledBy.name} (${w.enrolledBy.role})` : 'N/A'}</TableCell>
                    <TableCell>{(w.balance || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Funding Requests</Typography>
              <Button size="small" onClick={() => navigate('/funding')}>View All</Button>
      <Footer />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell>
                  <TableCell>Requested By</TableCell><TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fundingRequests.slice(0, 5).map(fr => (
                  <TableRow key={fr._id}>
                    <TableCell>{fr.project?.name}</TableCell>
                    <TableCell>{fr.amount}</TableCell>
                    <TableCell><Chip label={fr.status} color={fr.status==='approved'?'success':fr.status==='rejected'?'error':'warning'} /></TableCell>
                    <TableCell>{fr.requestedBy?.name}</TableCell>
                    <TableCell>
                      {fr.status === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => handleApproveFunding(fr._id)}>Approve</Button>
                          <Button size="small" color="error" onClick={() => handleRejectFunding(fr._id)}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Procurement Orders (Pending Funding)</Typography>
              <Button size="small" onClick={() => navigate('/procurement')}>View All</Button>
      <Footer />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell><TableCell>Items</TableCell><TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell><TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {procurementOrders.filter(o => o.status !== 'funded').slice(0, 5).map(o => (
                  <TableRow key={o._id}>
                    <TableCell>{o.project?.name}</TableCell>
                    <TableCell>{o.items?.length || 0}</TableCell>
                    <TableCell><Chip label={o.status} /></TableCell>
                    <TableCell>{o.createdBy?.name}</TableCell>
                    <TableCell>
                      {o.status === 'pending' && (
                        <Button size="small" color="primary" onClick={() => handleFundProcurement(o._id)}>Fund</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {period === 'week' ? 'Weekly' : 'Monthly'} Report
            </Typography>
            {reportData ? (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2">Workers Enrolled</Typography>
                  <Typography variant="h6">{reportData.workers || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2">Projects Created</Typography>
                  <Typography variant="h6">{reportData.projects || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2">Payments Made</Typography>
                  <Typography variant="h6">{reportData.payments || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2">Total Released</Typography>
                  <Typography variant="h6">ZMW {reportData.totalReleased?.toFixed(2) || '0.00'}</Typography>
                </Grid>
              </Grid>
            ) : <Typography>No data</Typography>}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Funding Requests vs Approved</Typography>
            {fundingChartData.length > 0 ? (
              <BarChart width={600} height={300} data={fundingChartData.slice(0, 5)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requested" fill="#8884d8" />
                <Bar dataKey="approved" fill="#82ca9d" />
              </BarChart>
            ) : <Typography>No funding requests to display.</Typography>}
          </Paper>
        </>
      )}

      <WorkerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleWorkerSelect} />
      {selectedWorker && (
        <PaymentModal open={paymentOpen} onClose={handlePaymentClose} worker={selectedWorker} onSuccess={fetchData} />
      )}

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

      {/* Footer */}
      <Box sx={{ mt: 4, py: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          © {new Date().getFullYear()} PURVEYOLS CMS – Construction Management System
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
          Built with ❤️ for construction professionals
        </Typography>
      <Footer />
      </Box>
      <Footer />
    </Box>
  );
};

export default AccountantDashboard;
