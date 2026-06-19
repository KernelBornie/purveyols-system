import DeliveryNote from "../../components/DeliveryNote";
import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../../api/axios';
import DeliveryNote from '../../components/DeliveryNote';

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', purpose: '', host: '', checkIn: new Date().toISOString().slice(0,16) });
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/visitors');
      const data = Array.isArray(res.data) ? res.data : [];
      setVisitors(data);
      const total = data.length;
      const today = data.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;
      setStats({ total, today });
    } catch (err) {
      console.error(err);
      setVisitors([]);
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
      await api.post('/api/visitors', form);
      setMessage({ type: 'success', text: 'Visitor logged' });
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Receptionist Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" startIcon={<PersonAddIcon />} onClick={() => setOpenModal(true)}>
            Log Visitor
          </Button>
        </Box>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Front Desk & Administrative Support</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
      <DeliveryNote />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Visitors</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Today's Visitors</Typography>
                <Typography variant="h4">{stats.today}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Visitor Log</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Check-in</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.map(v => (
                  <TableRow key={v._id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.phone}</TableCell>
                    <TableCell>{v.purpose}</TableCell>
                    <TableCell>{v.host}</TableCell>
                    <TableCell>{new Date(v.checkIn).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Visitor</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField label="Full Name" fullWidth margin="normal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Phone" fullWidth margin="normal" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Purpose" fullWidth margin="normal" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required />
            <TextField label="Host / Person to see" fullWidth margin="normal" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
            <TextField label="Check-in Time" type="datetime-local" fullWidth margin="normal" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Log Visitor</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ReceptionistDashboard;
