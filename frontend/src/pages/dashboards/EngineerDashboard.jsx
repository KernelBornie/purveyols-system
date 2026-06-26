import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0'];

const EngineerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [stats, setStats] = useState({ projects: 0, workers: 0, activeProjects: 0, boqs: 0 });

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
      setStats({
        projects: projectsData.length,
        workers: workersData.length,
        activeProjects: projectsData.filter(p => p.status === 'active').length,
        boqs: boqsData.length,
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Chart data ─────────────────────────────────────────────────────
  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'Paused', value: projects.filter(p => p.status === 'paused').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
    { name: 'Other', value: projects.filter(p => !['active','planning','paused','completed'].includes(p.status)).length },
  ].filter(d => d.value > 0);

  // Workers per project (top 5)
  const workersPerProject = projects
    .map(p => ({
      name: p.name?.length > 12 ? p.name.slice(0, 12) + '...' : p.name || 'Unnamed',
      workers: workers.filter(w => w.project?._id === p._id || w.project === p._id).length
    }))
    .sort((a, b) => b.workers - a.workers)
    .slice(0, 5)
    .filter(p => p.workers > 0);

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
          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Projects</Typography>
                  <Typography variant="h3">{stats.projects}</Typography>
                  <Typography variant="caption">{stats.activeProjects} active</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Workers Enrolled</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.workers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">BOQs Created</Typography>
                  <Typography variant="h4" color="#2196f3">{stats.boqs}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Completion Rate</Typography>
                  <Typography variant="h4" color="#ff9800">
                    {stats.projects > 0 ? Math.round((stats.activeProjects / stats.projects) * 100) : 0}%
                  </Typography>
                  <Typography variant="caption">{stats.activeProjects} of {stats.projects}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Project Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => `${value} projects`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Workers per Project (Top 5)</Typography>
                {workersPerProject.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={workersPerProject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip formatter={(value) => `${value} workers`} />
                      <Legend />
                      <Bar dataKey="workers" fill="#8884d8" name="Workers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 8 }}>
                    No workers assigned to projects yet.
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

          {/* ─── My Projects Table ───────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>
                      {/* ─── View (text button) ─────────────────────────── */}
                      <Button
                        component={Link}
                        to={`/projects/${p._id}`}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, textTransform: 'none' }}
                      >
                        View
                      </Button>
                      {/* ─── Edit (text button) ─────────────────────────── */}
                      <Button
                        component={Link}
                        to={`/projects/${p._id}/edit`}
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No projects available.</TableCell>
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