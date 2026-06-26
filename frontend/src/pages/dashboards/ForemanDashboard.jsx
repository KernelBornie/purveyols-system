import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ForemanDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    totalProjects: 0,
    activeProjects: 0,
    pendingWorkers: 0,
    totalPendingAmount: 0,
  });
  const [workersByProject, setWorkersByProject] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, projectsRes, attendanceRes, paymentsRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/projects'),
        api.get('/api/attendance'),
        api.get('/api/payments'),
      ]);
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const completedPayments = paymentsData.filter(p => p.status === 'completed');

      // Calculate worker balances
      const workersWithBalance = workersData.map(w => {
        const workerAttendance = attendanceData.filter(a => a.worker === w._id || a.worker?._id === w._id);
        const totalEarned = workerAttendance.reduce((sum, a) => sum + (a.days * a.rate || a.rate), 0);
        const workerPayments = completedPayments.filter(p => p.worker === w._id || p.worker?._id === w._id);
        const totalPaid = workerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return { ...w, balance: totalEarned - totalPaid };
      });

      setWorkers(workersWithBalance);
      setProjects(projectsData);
      setAttendance(attendanceData);
      setPayments(completedPayments);

      const totalWorkers = workersWithBalance.length;
      const activeWorkers = workersWithBalance.filter(w => w.status === 'active').length;
      const pendingWorkers = workersWithBalance.filter(w => (w.balance || 0) > 0).length;
      const totalPendingAmount = workersWithBalance.reduce((sum, w) => sum + (w.balance || 0), 0);
      const totalProjects = projectsData.length;
      const activeProjects = projectsData.filter(p => p.status === 'active').length;

      // Workers by project for chart
      const projectMap = {};
      workersWithBalance.forEach(w => {
        const projectId = w.project?._id || w.project;
        if (projectId) {
          const project = projectsData.find(p => p._id === projectId);
          const name = project?.name || 'Unknown Project';
          projectMap[name] = (projectMap[name] || 0) + 1;
        } else {
          projectMap['Unassigned'] = (projectMap['Unassigned'] || 0) + 1;
        }
      });
      const workersByProjectData = Object.entries(projectMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setWorkersByProject(workersByProjectData);

      setStats({
        totalWorkers,
        activeWorkers,
        totalProjects,
        activeProjects,
        pendingWorkers,
        totalPendingAmount,
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  // Project status data for pie chart
  const projectStatusData = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Paused', value: projects.filter(p => p.status === 'paused').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ].filter(d => d.value > 0);

  const actions = [
    { label: 'Enroll Worker', path: '/workers/new' },
    { label: 'Create Project', path: '/projects/new' },
    { label: 'Create Procurement Order', path: '/procurement/new' },
    { label: 'Request Funding', path: '/funding/new' },
    { label: 'Subcontract', path: '/subcontracts/new' },
    { label: 'Create BOQ', path: '/boq/new' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Foreman Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Site Supervision & Workforce</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* ─── Professional Stats Cards ─────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Workers</Typography>
                  <Typography variant="h3">{stats.totalWorkers}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{stats.activeWorkers} active</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Projects</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.totalProjects}</Typography>
                  <Typography variant="caption" color="textSecondary">{stats.activeProjects} active</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Pending Workers</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.pendingWorkers}</Typography>
                  <Typography variant="caption" color="textSecondary">with balance &gt; 0</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #f44336' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Total Pending Amount</Typography>
                  <Typography variant="h4" color="#f44336">{formatCurrency(stats.totalPendingAmount)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Project Status</Typography>
                {projectStatusData.length > 0 ? (
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
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No project data.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Workers by Project</Typography>
                {workersByProject.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={workersByProject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `${value} workers`} />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Workers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No workers assigned to projects.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Quick Actions ─────────────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              {actions.map((action, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Button component={Link} to={action.path} variant="contained" fullWidth>
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* ─── Workers Table ─────────────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Workers on Site</Typography>
              <Button component={Link} to="/workers" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>NRC</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.slice(0, 5).map(w => (
                  <TableRow key={w._id}>
                    <TableCell>{w.name}</TableCell>
                    <TableCell>{w.nrc}</TableCell>
                    <TableCell>{w.site || '—'}</TableCell>
                    <TableCell>{formatCurrency(w.dailyRate)}</TableCell>
                    <TableCell><Chip label={w.status} size="small" color={w.status === 'active' ? 'success' : 'default'} /></TableCell>
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
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ForemanDashboard;