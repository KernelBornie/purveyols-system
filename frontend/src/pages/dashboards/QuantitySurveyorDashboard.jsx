import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import StraightenIcon from '@mui/icons-material/Straighten';
import api from '../../api/axios';

const QuantitySurveyorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [sitePlans, setSitePlans] = useState([]);
  const [surveyData, setSurveyData] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    boqs: 0,
    submitted: 0,
    approved: 0,
    sitePlans: 0,
    surveyData: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, boqsRes, sitePlansRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/boq'),
        api.get('/api/site-plans'),
      ]);
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const boqsData = Array.isArray(boqsRes.data) ? boqsRes.data : [];
      const plansData = Array.isArray(sitePlansRes.data) ? sitePlansRes.data : [];

      setProjects(projectsData);
      setBoqs(boqsData);
      setSitePlans(plansData);

      const survey = plansData.filter(p => p.type === 'survey_data');
      setSurveyData(survey);

      setStats({
        projects: projectsData.length,
        boqs: boqsData.length,
        submitted: boqsData.filter(b => b.status === 'submitted').length,
        approved: boqsData.filter(b => b.status === 'approved').length,
        sitePlans: plansData.filter(p => p.type !== 'survey_data').length,
        surveyData: survey.length,
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
    { label: 'New Site Plan', path: '/site-plans/new', icon: <ArchitectureIcon /> },
    { label: 'New Survey', path: '/site-plans/new?type=survey_data', icon: <StraightenIcon /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Quantity Surveyor Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Cost Management & Design</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Projects</Typography>
                <Typography variant="h4">{stats.projects}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">BOQs Created</Typography>
                <Typography variant="h4">{stats.boqs}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Submitted BOQs</Typography>
                <Typography variant="h4" color="warning.main">{stats.submitted}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ borderLeft: '4px solid #1976d2' }}><CardContent>
                <Typography variant="body2" color="textSecondary">Site Plans</Typography>
                <Typography variant="h4">{stats.sitePlans}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ borderLeft: '4px solid #2e7d32' }}><CardContent>
                <Typography variant="body2" color="textSecondary">Survey Data</Typography>
                <Typography variant="h4">{stats.surveyData}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              {actions.map((action, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
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

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Recent BOQs</Typography>
              <Button component={Link} to="/boq" size="small">View All</Button>
            </Box>
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

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Recent Site Plans & Survey Data</Typography>
              <Button component={Link} to="/site-plans" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sitePlans.slice(0, 5).map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.type === 'survey_data' ? 'Survey' : p.type.replace('_', ' ')}
                        size="small"
                        color={p.type === 'survey_data' ? 'success' : 'info'}
                      />
                    </TableCell>
                    <TableCell>{p.project?.name || 'N/A'}</TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'approved' ? 'success' : 'warning'} /></TableCell>
                    <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {sitePlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No site plans or survey data yet.</TableCell>
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

export default QuantitySurveyorDashboard;
