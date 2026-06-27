import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip, Alert, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckInIcon from '@mui/icons-material/AssignmentTurnedIn';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    date: new Date().toISOString().split('T')[0],
    days: 1,
    rate: 0,
    site: '',
    notes: '',
  });
  const [message, setMessage] = useState(null);

  const canEdit = ['admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'].includes(user?.role);
  const canCheckIn = canEdit;

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker?')) return;
    try {
      await api.delete(`/api/workers/${id}`);
      fetchWorkers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleCheckInOpen = (worker) => {
    setSelectedWorker(worker);
    setCheckInForm({
      date: new Date().toISOString().split('T')[0],
      days: 1,
      rate: worker.dailyRate || 0,
      site: worker.site || '',
      notes: '',
    });
    setCheckInOpen(true);
  };

  const handleCheckInSubmit = async () => {
    if (!selectedWorker) return;
    if (!checkInForm.date || checkInForm.days <= 0 || checkInForm.rate < 0) {
      setMessage({ type: 'error', text: 'Please fill all fields correctly.' });
      return;
    }
    try {
      await api.post('/api/attendance', {
        workerId: selectedWorker._id,
        date: checkInForm.date,
        days: checkInForm.days,
        rate: checkInForm.rate,
        site: checkInForm.site,
        notes: checkInForm.notes,
      });
      setCheckInOpen(false);
      setMessage({ type: 'success', text: `Checked in ${selectedWorker.name} for ${checkInForm.days} day(s)` });
      fetchWorkers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Check‑in failed' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Workers</Typography>
        {canEdit && (
          <Button component={Link} to="/workers/new" variant="contained" startIcon={<AddIcon />}>
            Enroll Worker
          </Button>
        )}
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Table size="small">
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Photo</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>NRC</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Daily Rate</TableCell>
            <TableCell>Pending</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker._id}>
              <TableCell>
                <Avatar
                  src={worker.photo}
                  sx={{ width: 40, height: 40 }}
                >
                  {!worker.photo && worker.name?.charAt(0).toUpperCase()}
                </Avatar>
              </TableCell>
              <TableCell>{worker.name}</TableCell>
              <TableCell>{worker.nrc}</TableCell>
              <TableCell>{worker.phone}</TableCell>
              <TableCell>{worker.project?.name || '—'}</TableCell>
              <TableCell>
                <Chip label={worker.status} color={getStatusColor(worker.status)} size="small" />
              </TableCell>
              <TableCell>K {worker.dailyRate || 0}</TableCell>
              <TableCell>K {worker.balance || 0}</TableCell>
              <TableCell>
                {/* ─── View ────────────────────────────────────────── */}
                <Button
                  component={Link}
                  to={`/workers/${worker._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {/* ─── Edit ────────────────────────────────────────── */}
                {canEdit && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/workers/${worker._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* ─── Check In ────────────────────────────────────── */}
                {canCheckIn && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckInIcon />}
                    onClick={() => handleCheckInOpen(worker)}
                    sx={{ mr: 0.5, textTransform: 'none' }}
                  >
                    Check In
                  </Button>
                )}

                {/* ─── Delete ───────────────────────────────────────── */}
                {canEdit && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(worker._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {workers.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No workers enrolled yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Check‑in Modal */}
      <Dialog open={checkInOpen} onClose={() => setCheckInOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check In Worker</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedWorker?.name} – {selectedWorker?.project?.name || 'No project'}
          </Typography>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={checkInForm.date}
            onChange={e => setCheckInForm({ ...checkInForm, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Days Worked"
            type="number"
            fullWidth
            margin="dense"
            value={checkInForm.days}
            onChange={e => setCheckInForm({ ...checkInForm, days: Math.max(1, Number(e.target.value)) })}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Rate (ZMW per day)"
            type="number"
            fullWidth
            margin="dense"
            value={checkInForm.rate}
            onChange={e => setCheckInForm({ ...checkInForm, rate: Math.max(0, Number(e.target.value)) })}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Site"
            fullWidth
            margin="dense"
            value={checkInForm.site}
            onChange={e => setCheckInForm({ ...checkInForm, site: e.target.value })}
          />
          <TextField
            label="Notes"
            fullWidth
            margin="dense"
            value={checkInForm.notes}
            onChange={e => setCheckInForm({ ...checkInForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCheckInSubmit}>
            Confirm Check‑in
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkerList;