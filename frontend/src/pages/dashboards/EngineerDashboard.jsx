import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const EngineerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({ projects: 0, workers: 0, activeProjects: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, workersRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/workers'),
      ]);
      setProjects(projectsRes.data);
      setWorkers(workersRes.data);
      setStats({
        projects: projectsRes.data.length,
        workers: workersRes.data.length,
        activeProjects: projectsRes.data.filter(p => p.status === 'active').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const actions = [
    { label: 'Enroll Worker', path: '/workers/new' },
    { label: 'Create Project', path: '/projects/new' },
    { label: 'Create Procurement Order', path: '/procurement/new' },
    { label: 'Request Funding', path: '/funding/new' },
    { label: 'Subcontract', path: '/subcontracts/new' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Civil Engineer Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>
      <Typography variant="subtitle1" gutterBottom>Technical Design & Site Supervision</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Projects</Typography>
                <Typography variant="h4">{stats.projects}</Typography>
                <Typography variant="caption">{stats.activeProjects} active</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Workers Enrolled</Typography>
                <Typography variant="h4">{stats.workers}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Quick Actions</Typography>
                <Button component={Link} to="/workers/new" variant="outlined" size="small">Enroll</Button>
                <Button component={Link} to="/projects/new" variant="outlined" size="small" sx={{ ml: 1 }}>Project</Button>
              </CardContent></Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Actions</Typography>
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

          {/* Recent Projects */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>My Projects</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell><Chip label={p.status} size="small" /></TableCell>
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

export default EngineerDashboard;
