import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const QuantitySurveyorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [stats, setStats] = useState({ projects: 0, boqs: 0, submitted: 0, approved: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, boqsRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/boq'),
      ]);
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const boqsData = Array.isArray(boqsRes.data) ? boqsRes.data : [];
      setProjects(projectsData);
      setBoqs(boqsData);
      setStats({
        projects: projectsData.length,
        boqs: boqsData.length,
        submitted: boqsData.filter(b => b.status === 'submitted').length,
        approved: boqsData.filter(b => b.status === 'approved').length,
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
        <Typography variant="h4">Quantity Surveyor Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>
      <Typography variant="subtitle1" gutterBottom>Cost Management & BOQ</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Projects</Typography>
                <Typography variant="h4">{stats.projects}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">BOQs Created</Typography>
                <Typography variant="h4">{stats.boqs}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Submitted</Typography>
                <Typography variant="h4" color="warning.main">{stats.submitted}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Approved</Typography>
                <Typography variant="h4" color="success.main">{stats.approved}</Typography>
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
            <Typography variant="h6" gutterBottom>Recent BOQs</Typography>
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
                {boqs.slice(0, 5).map(b => (
                  <TableRow key={b._id}>
                    <TableCell>{b.project?.name}</TableCell>
                    <TableCell>{b.items?.length || 0}</TableCell>
                    <TableCell><Chip label={b.status} color={b.status === 'approved' ? 'success' : b.status === 'submitted' ? 'warning' : 'default'} /></TableCell>
                    <TableCell>{b.createdBy?.name}</TableCell>
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

export default QuantitySurveyorDashboard;
