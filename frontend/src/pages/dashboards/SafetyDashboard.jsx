import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';
import DeliveryNote from '../../components/DeliveryNote';

const SafetyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ site: '', date: '', findings: '', status: 'pending' });
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/safety-reports');
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) data = res.data.data;
      else data = [];
      setInspections(data);
      const total = data.length;
      const passed = data.filter(i => i.status === 'passed').length;
      const failed = data.filter(i => i.status === 'failed').length;
      const pending = data.filter(i => i.status === 'pending').length;
      setStats({ total, passed, failed, pending });
    } catch (err) {
      console.error(err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/safety-reports', form);
      setMessage({ type: 'success', text: 'Inspection report submitted' });
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    }
  };

  const quickActions = [
    { label: 'Create Procurement Order', path: '/procurement/new' },
    { label: 'Request Funding', path: '/funding/new' },
    { label: 'New Inspection', action: 'modal' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Safety Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
            New Inspection
          </Button>
        </Box>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Workplace Safety & Compliance</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Inspections</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Passed</Typography>
                <Typography variant="h4" color="success.main">{stats.passed}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Failed</Typography>
                <Typography variant="h4" color="error.main">{stats.failed}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Pending</Typography>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  {action.path ? (
                    <Button component={Link} to={action.path} variant="contained" fullWidth>
                      {action.label}
                    </Button>
                  ) : (
                    <Button variant="contained" fullWidth onClick={() => setOpenModal(true)}>
                      {action.label}
                    </Button>
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Inspection Reports</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Findings</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspections.map(i => (
                  <TableRow key={i._id}>
                    <TableCell>{i.site}</TableCell>
                    <TableCell>{new Date(i.date).toLocaleDateString()}</TableCell>
                    <TableCell>{i.findings}</TableCell>
                    <TableCell><Chip label={i.status} color={i.status === 'passed' ? 'success' : i.status === 'failed' ? 'error' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Safety Inspection</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField label="Site" fullWidth margin="normal" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} required />
            <TextField label="Date" type="date" fullWidth margin="normal" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} required />
            <TextField label="Findings / Observations" fullWidth margin="normal" multiline rows={3} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} required />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit Report</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SafetyDashboard;
