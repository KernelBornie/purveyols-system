import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';

const AccountantDashboard = () => {
  const [stats, setStats] = useState({
    workers: 0,
    projects: 0,
    payments: 0,
    fundingRequests: 0,
    totalReleased: 0,
  });
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, projectsRes, fundingRes, procRes, paymentsRes, reportRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/projects'),
        api.get('/api/funding-requests'),
        api.get('/api/procurement'),
        api.get('/api/payments'),
        api.get(`/api/reports/accountant?period=${period}`)
      ]);

      setWorkers(workersRes.data);
      setProjects(projectsRes.data);
      setFundingRequests(fundingRes.data);
      setProcurementOrders(procRes.data);
      setPayments(paymentsRes.data);
      setReportData(reportRes.data);

      const totalReleased = paymentsRes.data.reduce((sum, p) => sum + p.amount, 0);
      setStats({
        workers: workersRes.data.length,
        projects: projectsRes.data.length,
        payments: paymentsRes.data.length,
        fundingRequests: fundingRes.data.length,
        totalReleased,
      });
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleRejectFunding = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/funding-requests/${id}/reject`, { reason });
      fetchData();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleFundProcurement = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/fund`);
      fetchData();
    } catch (err) {
      alert('Failed to fund order');
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

  const chartData = fundingRequests.map(fr => ({
    name: fr.project?.name || 'N/A',
    requested: fr.amount,
    approved: fr.status === 'approved' ? fr.amount : 0,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Workers</Typography>
            <Typography variant="h4">{stats.workers}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Projects</Typography>
            <Typography variant="h4">{stats.projects}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Total Released</Typography>
            <Typography variant="h4">ZMW {stats.totalReleased.toFixed(2)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
            <Typography variant="h4">{stats.fundingRequests}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)} sx={{ mr: 2 }}>
          Pay Worker (Airtel Money)
        </Button>
        <Button variant="outlined" onClick={() => setPeriod(period === 'week' ? 'month' : 'week')}>
          Switch to {period === 'week' ? 'Monthly' : 'Weekly'} Report
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Projects by Creator</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Created By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map(p => (
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
        <Typography variant="h6" gutterBottom>Enrolled Workers</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>NRC</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Enrolled By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map(w => (
              <TableRow key={w._id}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.nrc}</TableCell>
                <TableCell>{w.phone}</TableCell>
                <TableCell>{w.site}</TableCell>
                <TableCell>{w.enrolledBy ? `${w.enrolledBy.name} (${w.enrolledBy.role})` : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Funding Requests</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fundingRequests.map(fr => (
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
        <Typography variant="h6" gutterBottom>Procurement Orders (Pending Funding)</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {procurementOrders.filter(o => o.status !== 'funded').map(o => (
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
        {loading ? (
          <CircularProgress />
        ) : reportData ? (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">Workers Enrolled</Typography>
              <Typography variant="h6">{reportData.workersEnrolled}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">Projects Created</Typography>
              <Typography variant="h6">{reportData.projectsCreated}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">Payments Made</Typography>
              <Typography variant="h6">{reportData.payments}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">Total Released</Typography>
              <Typography variant="h6">ZMW {reportData.totalAmountReleased.toFixed(2)}</Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography>No data</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Funding Requests vs Approved</Typography>
        {chartData.length > 0 ? (
          <BarChart width={600} height={300} data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="requested" fill="#8884d8" />
            <Bar dataKey="approved" fill="#82ca9d" />
          </BarChart>
        ) : (
          <Typography>No funding requests to display.</Typography>
        )}
      </Paper>

      <WorkerSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleWorkerSelect}
      />

      {selectedWorker && (
        <PaymentModal
          open={paymentOpen}
          onClose={handlePaymentClose}
          worker={selectedWorker}
          project={null}
        />
      )}
    </Box>
  );
};

export default AccountantDashboard;
