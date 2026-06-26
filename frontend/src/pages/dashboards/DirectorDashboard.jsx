import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const DirectorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalFundingRequests: 0,
    pendingFunding: 0,
    totalBOQs: 0,
    pendingBOQs: 0,
    totalWorkers: 0,
    totalSubcontracts: 0,
    pendingProcurement: 0,
    visitors: 0,
    todayVisitors: 0,
  });
  const [projects, setProjects] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [workers, setWorkers] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, fundingRes, boqRes, procRes, workersRes, visitorsRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/funding-requests'),
        api.get('/api/boq'),
        api.get('/api/procurement'),
        api.get('/api/workers'),
        api.get('/api/visitors'),
      ]);
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const fundingData = Array.isArray(fundingRes.data) ? fundingRes.data : [];
      const boqData = Array.isArray(boqRes.data) ? boqRes.data : [];
      const procData = Array.isArray(procRes.data) ? procRes.data : [];
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];
      const visitorsData = Array.isArray(visitorsRes.data) ? visitorsRes.data : [];
      const totalVisitors = visitorsData.length;
      const todayVisitors = visitorsData.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;

      setProjects(projectsData);
      setFundingRequests(fundingData);
      setBoqs(boqData);
      setProcurementOrders(procData);
      setWorkers(workersData);

      const activeProjects = projectsData.filter(p => p.status === 'active').length;
      const pendingFunding = fundingData.filter(f => f.status === 'pending').length;
      const pendingBOQs = boqData.filter(b => b.status === 'draft' || b.status === 'submitted').length;
      const pendingProcurement = procData.filter(o => o.status === 'procurement_approved').length;

      setStats({
        totalProjects: projectsData.length,
        activeProjects,
        totalFundingRequests: fundingData.length,
        pendingFunding,
        totalBOQs: boqData.length,
        pendingBOQs,
        totalWorkers: workersData.length,
        totalSubcontracts: 0,
        pendingProcurement,
        visitors: totalVisitors,
        todayVisitors,
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Funding actions ──────────────────────────────────────────
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

  // ─── BOQ actions ──────────────────────────────────────────────
  const handleApproveBOQ = async (id) => {
    try {
      await api.put(`/api/boq/${id}/approve`);
      fetchData();
    } catch (err) { alert('Approval failed'); }
  };

  const handleRejectBOQ = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/boq/${id}/reject`, { reason });
      fetchData();
    } catch (err) {
      alert('Rejection failed. The backend may not support BOQ rejection yet.');
    }
  };

  // ─── Procurement actions ──────────────────────────────────────
  const handleFinalApproveProcurement = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/final-approve`);
      fetchData();
    } catch (err) { alert('Final approval failed'); }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const projectStatusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
    { name: 'Paused', value: projects.filter(p => p.status === 'paused').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ].filter(d => d.value > 0);

  const fundingChartData = fundingRequests
    .filter(f => f.amount > 0)
    .slice(0, 5)
    .map(f => ({ name: f.project?.name || 'N/A', amount: f.amount }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Director Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Strategic Leadership & Oversight</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/projects" variant="contained" fullWidth>
                  Manage Projects
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/workers" variant="contained" fullWidth>
                  View Workers
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/funding" variant="contained" fullWidth>
                  Funding Requests
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/boq" variant="contained" fullWidth>
                  BOQs
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Stats Cards – Professional (5 cards) */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Projects</Typography>
                  <Typography variant="h3">{stats.totalProjects}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{stats.activeProjects} active</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.totalFundingRequests}</Typography>
                  <Typography variant="caption" color="warning.main">{stats.pendingFunding} pending</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">BOQs</Typography>
                  <Typography variant="h4" color="#2196f3">{stats.totalBOQs}</Typography>
                  <Typography variant="caption" color="warning.main">{stats.pendingBOQs} pending</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Workers</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.totalWorkers}</Typography>
                  <Typography variant="caption" color="textSecondary">enrolled</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Visitors</Typography>
                  <Typography variant="h4" color="#9c27b0">{stats.visitors}</Typography>
                  <Typography variant="caption" color="textSecondary">{stats.todayVisitors} today</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Project Status</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value} projects`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Top Funding Requests</Typography>
                {fundingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={fundingChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `K${value.toLocaleString()}`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No funding requests yet.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Projects Table */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">All Projects</Typography>
              <Button component={Link} to="/projects" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{formatCurrency(p.budget)}</TableCell>
                    <TableCell>{p.manager?.name || 'N/A'}</TableCell>
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

          {/* Funding Requests Table */}
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fundingRequests.slice(0, 5).map(f => (
                  <TableRow key={f._id}>
                    <TableCell>{f.project?.name}</TableCell>
                    <TableCell>{formatCurrency(f.amount)}</TableCell>
                    <TableCell><Chip label={f.status} color={f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                    <TableCell>{f.requestedBy?.name}</TableCell>
                    <TableCell>
                      <Button component={Link} to={`/funding/${f._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                        View
                      </Button>
                      {f.status === 'pending' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveFunding(f._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleRejectFunding(f._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* BOQs Table */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">BOQs</Typography>
              <Button component={Link} to="/boq" size="small">View All</Button>
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
                {boqs.slice(0, 5).map(b => (
                  <TableRow key={b._id}>
                    <TableCell>{b.project?.name}</TableCell>
                    <TableCell>{b.items?.length || 0}</TableCell>
                    <TableCell><Chip label={b.status} color={b.status === 'approved' ? 'success' : b.status === 'submitted' ? 'warning' : 'default'} /></TableCell>
                    <TableCell>{b.createdBy?.name}</TableCell>
                    <TableCell>
                      <Button component={Link} to={`/boq/${b._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                        View
                      </Button>
                      {b.status === 'submitted' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveBOQ(b._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleRejectBOQ(b._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Procurement Orders */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Procurement Orders (Oversight)</Typography>
              <Button component={Link} to="/procurement" size="small">View All</Button>
            </Box>
            <Typography variant="caption" color="textSecondary">
              Procurement Officer adds prices, Accountant funds – Director gives final approval.
            </Typography>
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
                    <TableCell><Chip label={o.status} color={o.status === 'funded' ? 'success' : o.status === 'procurement_approved' ? 'info' : 'warning'} /></TableCell>
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
                        >
                          Final Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default DirectorDashboard;