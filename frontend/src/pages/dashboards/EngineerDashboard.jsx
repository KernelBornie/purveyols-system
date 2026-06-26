import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ConstructionIcon from '@mui/icons-material/Construction';
import DescriptionIcon from '@mui/icons-material/Description';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import StraightenIcon from '@mui/icons-material/Straighten';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EngineerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    workers: 0,
    activeProjects: 0,
    boqs: 0,
    approvedBOQs: 0,
  });
  const [workersByProject, setWorkersByProject] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, workersRes, boqsRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/workers'),
        api.get('/api/boq'),
      ]);
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];
      const boqsData = Array.isArray(boqsRes.data) ? boqsRes.data : [];

      setProjects(projectsData);
      setWorkers(workersData);
      setBoqs(boqsData);

      const activeProjects = projectsData.filter(p => p.status === 'active').length;
      const approvedBOQs = boqsData.filter(b => b.status === 'approved').length;

      setStats({
        projects: projectsData.length,
        workers: workersData.length,
        activeProjects,
        boqs: boqsData.length,
        approvedBOQs,
      });

      // ─── Workers by project (top 5) ──────────────────────────────
      const projectMap = {};
      workersData.forEach(w => {
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

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Chart data ─────────────────────────────────────────────────────
  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Paused', value: projects.filter(p => p.status === 'paused').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ].filter(d => d.value > 0);

  const boqStatusData = [
    { name: 'Draft', value: boqs.filter(b => b.status === 'draft').length },
    { name: 'Submitted', value: boqs.filter(b => b.status === 'submitted').length },
    { name: 'Approved', value: stats.approvedBOQs },
    { name: 'Rejected', value: boqs.filter(b => b.status === 'rejected').length },
  ].filter(d => d.value > 0);

  // ─── Quick Actions (8 actions, same as QS) ──────────────────────
  const actions = [
    { label: 'Enroll Worker', path: '/workers/new', icon: <PeopleIcon /> },
    { label: 'Create Project', path: '/projects/new', icon: <BusinessIcon /> },
    { label: 'Create Procurement Order', path: '/procurement/new', icon: <ReceiptIcon /> },
    { label: 'Request Funding', path: '/funding/new', icon: <AttachMoneyIcon /> },
    { label: 'Subcontract', path: '/subcontracts/new', icon: <ConstructionIcon /> },
    { label: 'Create BOQ', path: '/boq/new', icon: <DescriptionIcon /> },
    { label: 'New Site Plan', path: '/site-plans/new', icon: <ArchitectureIcon /> },
    { label: 'New Survey', path: '/site-plans/new?type=survey_data', icon: <StraightenIcon /> },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Civil Engineer Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Technical Design & Site Supervision</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* ─── Professional Stats Cards (5 cards) ───────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Projects</Typography>
                  <Typography variant="h3">{stats.projects}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{stats.activeProjects} active</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Workers Enrolled</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.workers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">BOQs Created</Typography>
                  <Typography variant="h4" color="#2196f3">{stats.boqs}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Approved BOQs</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.approvedBOQs}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Active Projects</Typography>
                  <Typography variant="h4" color="#9c27b0">{stats.activeProjects}</Typography>
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
                    No project data available.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>BOQ Status</Typography>
                {boqStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={boqStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {boqStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} BOQs`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No BOQ data available.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Bar Chart: Workers by Project ───────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Workers by Project (Top 5)</Typography>
                {workersByProject.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={workersByProject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
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
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {actions.map((action, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Button
                        component={Link}
                        to={action.path}
                        variant="contained"
                        fullWidth
                        startIcon={action.icon || null}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Projects Table ───────────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">My Projects</Typography>
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
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No projects available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* ─── Workers Table ────────────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Recent Workers</Typography>
              <Button component={Link} to="/workers" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>NRC</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Project</TableCell>
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
                    <TableCell>{w.project?.name || '—'}</TableCell>
                    <TableCell>
                      <Button component={Link} to={`/workers/${w._id}`} size="small" variant="outlined">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {workers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No workers enrolled.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default EngineerDashboard;