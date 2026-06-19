import DeliveryNote from "../../components/DeliveryNote";
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import DeliveryNote from '../../components/DeliveryNote';

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
      <DeliveryNote />
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
                <Typography variant="body2" color="textSecondary">BOQs Created</Typography>
                <Typography variant="h4">{stats.boqs}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

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
                      <IconButton
                        component={Link}
                        to={`/projects/${p._id}`}
                        size="small"
                        color="primary"
                        title="Edit Project"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        component={Link}
                        to={`/projects/${p._id}`}
                        size="small"
                        color="info"
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
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

export default EngineerDashboard;
