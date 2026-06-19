import DeliveryNote from "../../components/DeliveryNote";
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const ForemanDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ workers: 0, projects: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, projectsRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/projects'),
      ]);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setStats({
        workers: workersRes.data.length,
        projects: projectsRes.data.length,
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
        <Typography variant="h4">Foreman Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>
      <Typography variant="subtitle1" gutterBottom>Site Supervision & Workforce</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
      <DeliveryNote />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Workers</Typography>
                <Typography variant="h4">{stats.workers}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Projects</Typography>
                <Typography variant="h4">{stats.projects}</Typography>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.slice(0, 5).map(w => (
                  <TableRow key={w._id}>
                    <TableCell>{w.name}</TableCell>
                    <TableCell>{w.nrc}</TableCell>
                    <TableCell>{w.site}</TableCell>
                    <TableCell>{w.dailyRate}</TableCell>
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
