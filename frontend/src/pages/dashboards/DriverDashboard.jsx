import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const DriverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [logbooks, setLogbooks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ vehicle: '', route: '', startTime: '', endTime: '', distance: '', fuelUsed: '', notes: '' });
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/logbooks');
      // Safely extract array from response
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.logbooks)) {
        data = res.data.logbooks;
      } else {
        console.warn('Unexpected response format:', res.data);
        data = [];
      }
      setLogbooks(data);
      const total = data.length;
      const completed = data.filter(l => l.status === 'completed').length;
      const inProgress = data.filter(l => l.status === 'in-progress').length;
      setStats({ total, completed, inProgress });
    } catch (err) {
      console.error(err);
      setLogbooks([]);
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
      await api.post('/api/logbooks', form);
      setMessage({ type: 'success', text: 'Logbook submitted' });
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Driver Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
            New Logbook
          </Button>
        </Box>
      </Box>
      <Typography variant="subtitle1" gutterBottom>Transport & Logistics</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Trips</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Completed</Typography>
                <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">In Progress</Typography>
                <Typography variant="h4" color="warning.main">{stats.inProgress}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Logbook Entries</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Distance</TableCell>
                  <TableCell>Fuel Used</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logbooks.map(l => (
                  <TableRow key={l._id}>
                    <TableCell>{l.vehicle}</TableCell>
                    <TableCell>{l.route}</TableCell>
                    <TableCell>{l.distance} km</TableCell>
                    <TableCell>{l.fuelUsed} L</TableCell>
                    <TableCell><Chip label={l.status} color={l.status === 'completed' ? 'success' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Logbook Entry</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField label="Vehicle" fullWidth margin="normal" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required />
            <TextField label="Route" fullWidth margin="normal" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} required />
            <TextField label="Start Time" type="datetime-local" fullWidth margin="normal" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="End Time" type="datetime-local" fullWidth margin="normal" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Distance (km)" type="number" fullWidth margin="normal" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} />
            <TextField label="Fuel Used (L)" type="number" fullWidth margin="normal" value={form.fuelUsed} onChange={e => setForm({ ...form, fuelUsed: e.target.value })} />
            <TextField label="Notes" fullWidth margin="normal" multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
