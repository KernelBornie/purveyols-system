import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../api/axios';

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
  });
  const [projects, setProjects] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [workers, setWorkers] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, fundingRes, boqRes, procRes, workersRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/funding-requests'),
        api.get('/api/boq'),
        api.get('/api/procurement'),
        api.get('/api/workers'),
      ]);
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const fundingData = Array.isArray(fundingRes.data) ? fundingRes.data : [];
      const boqData = Array.isArray(boqRes.data) ? boqRes.data : [];
      const procData = Array.isArray(procRes.data) ? procRes.data : [];
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];

      setProjects(projectsData);
      setFundingRequests(fundingData);
      setBoqs(boqData);
      setProcurementOrders(procData);
      setWorkers(workersData);

      const activeProjects = projectsData.filter(p => p.status === 'active').length;
      const pendingFunding = fundingData.filter(f => f.status === 'pending').length;
      const pendingBOQs = boqData.filter(b => b.status === 'draft' || b.status === 'submitted').length;

      setStats({
        totalProjects: projectsData.length,
        activeProjects,
        totalFundingRequests: fundingData.length,
        pendingFunding,
        totalBOQs: boqData.length,
        pendingBOQs,
        totalWorkers: workersData.length,
        totalSubcontracts: 0,
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproveBOQ = async (id) => {
    try {
      await api.put(`/api/boq/${id}/approve`);
      fetchData();
    } catch (err) { alert('Approval failed'); }
  };

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

  const projectStatusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
    { name: 'Paused', value: projects.filter(p => p.status === 'paused').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ];
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  const fundingChartData = fundingRequests.map(f => ({ name: f.project?.name || 'N/A', amount: f.amount }));

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
                <Button component={Link} to="/projects" variant="contained" fullWidth startIcon={<EditIcon />}>
                  Manage Projects
                </Button>
                <Typography variant="caption" color="textSecondary">Edit or view all projects</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/workers" variant="contained" fullWidth>
                  View Workers
                </Button>
                <Typography variant="caption" color="textSecondary">See all enrolled workers</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/funding" variant="contained" fullWidth>
                  Funding Requests
                </Button>
                <Typography variant="caption" color="textSecondary">Approve/reject requests</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button component={Link} to="/boq" variant="contained" fullWidth>
                  BOQs
                </Button>
                <Typography variant="caption" color="textSecondary">Approve Bills of Quantities</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Stats Cards */}
      <DeliveryNote />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Projects</Typography>
                <Typography variant="h4">{stats.totalProjects}</Typography>
                <Typography variant="caption" color="textSecondary">{stats.activeProjects} active</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
                <Typography variant="h4">{stats.totalFundingRequests}</Typography>
                <Typography variant="caption" color="warning.main">{stats.pendingFunding} pending</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">BOQs</Typography>
                <Typography variant="h4">{stats.totalBOQs}</Typography>
                <Typography variant="caption" color="warning.main">{stats.pendingBOQs} pending</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Workers</Typography>
                <Typography variant="h4">{stats.totalWorkers}</Typography>
                <Typography variant="caption" color="textSecondary">enrolled</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          {/* Charts */}
      <DeliveryNote />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Project Status</Typography>
                <PieChart width={300} height={200}>
                  <Pie data={projectStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Funding Requests</Typography>
                <BarChart width={350} height={200} data={fundingChartData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{p.budget}</TableCell>
                    <TableCell>{p.manager?.name || 'N/A'}</TableCell>
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
                    <TableCell>{f.amount}</TableCell>
                    <TableCell><Chip label={f.status} color={f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                    <TableCell>{f.requestedBy?.name}</TableCell>
                    <TableCell>
                      {f.status === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => handleApproveFunding(f._id)}>Approve</Button>
                          <Button size="small" color="error" onClick={() => handleRejectFunding(f._id)}>Reject</Button>
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
                      {b.status === 'submitted' && (
                        <Button size="small" color="primary" onClick={() => handleApproveBOQ(b._id)}>Approve</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Procurement Orders (Oversight) */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Procurement Orders (Oversight)</Typography>
              <Button component={Link} to="/procurement" size="small">View All</Button>
            </Box>
            <Typography variant="caption" color="textSecondary">Procurement Officer adds prices, Accountant funds</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {procurementOrders.slice(0, 5).map(o => (
                  <TableRow key={o._id}>
                    <TableCell>{o.project?.name}</TableCell>
                    <TableCell>{o.items?.length || 0}</TableCell>
                    <TableCell><Chip label={o.status} color={o.status === 'funded' ? 'success' : o.status === 'purchased' ? 'info' : 'warning'} /></TableCell>
                    <TableCell>{o.createdBy?.name}</TableCell>
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
