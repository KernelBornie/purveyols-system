import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, CircularProgress, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, Snackbar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const BiddedProjects = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    status: 'bidded',
    bidAmount: '',
    notes: '',
    followUpDate: '',
    contactPerson: '',
    contactPhone: '',
  });

  const fetchBids = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/bids');
      setBids(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBids(); }, []);

  const handleEditOpen = (bid) => {
    setSelectedBid(bid);
    setForm({
      status: bid.status || 'bidded',
      bidAmount: bid.bidAmount || '',
      notes: bid.notes || '',
      followUpDate: bid.followUpDate ? new Date(bid.followUpDate).toISOString().split('T')[0] : '',
      contactPerson: bid.contactPerson || '',
      contactPhone: bid.contactPhone || '',
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedBid(null);
    setForm({ status: 'bidded', bidAmount: '', notes: '', followUpDate: '', contactPerson: '', contactPhone: '' });
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/api/bids/${selectedBid._id}`, form);
      setSnackbar({ open: true, message: 'Bid updated!', severity: 'success' });
      fetchBids();
      handleEditClose();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update bid', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bid?')) return;
    try {
      await api.delete(`/api/bids/${id}`);
      setSnackbar({ open: true, message: 'Bid deleted', severity: 'success' });
      fetchBids();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const getStatusColor = (status) => ({
    bidded: 'warning', shortlisted: 'info', interviewing: 'primary',
    awarded: 'success', lost: 'error', withdrawn: 'default'
  }[status] || 'default');

  const getStatusLabel = (status) => ({
    bidded: 'Bidded', shortlisted: 'Shortlisted', interviewing: 'Interviewing',
    awarded: '🏆 Awarded', lost: '❌ Lost', withdrawn: 'Withdrawn'
  }[status] || status);

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">✅ Bidded Projects</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchBids}>Refresh</Button>
      </Box>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>Projects you have bid on – track their status</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : bids.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No bidded projects yet</Typography>
          <Button variant="contained" onClick={() => navigate('/advertised-projects')} sx={{ mt: 2 }}>View Open Projects</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bids.map((bid) => (
            <Grid item xs={12} md={6} lg={4} key={bid._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderLeft: `4px solid ${bid.status === 'awarded' ? '#4caf50' : bid.status === 'lost' ? '#f44336' : '#ff9800'}` }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap title={bid.projectTitle}>{bid.projectTitle}</Typography>
                    <Chip label={getStatusLabel(bid.status)} size="small" color={getStatusColor(bid.status)} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<BusinessIcon />} label={bid.client} variant="outlined" />
                    <Chip size="small" icon={<LocationOnIcon />} label={bid.location} variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {bid.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<AttachMoneyIcon />} label={bid.budget} variant="outlined" />
                    <Chip size="small" icon={<CalendarTodayIcon />} label={`Deadline: ${bid.deadline}`} variant="outlined" />
                  </Box>
                  {bid.bidAmount && <Typography variant="body2"><strong>Bid Amount:</strong> {bid.bidAmount}</Typography>}
                  {bid.notes && <Typography variant="caption" color="textSecondary" display="block">📝 {bid.notes}</Typography>}
                  <Typography variant="caption" color="textSecondary" display="block">
                    Bidded: {new Date(bid.bidDate).toLocaleDateString()}
                    {bid.followUpDate && ` • Follow-up: ${new Date(bid.followUpDate).toLocaleDateString()}`}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditOpen(bid)}>Edit</Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(bid._id)}>Delete</Button>
                  <Button size="small" href={bid.sourceUrl} target="_blank">Source</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Bid</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField select label="Status" fullWidth margin="normal" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="bidded">Bidded</MenuItem>
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="interviewing">Interviewing</MenuItem>
              <MenuItem value="awarded">🏆 Awarded</MenuItem>
              <MenuItem value="lost">❌ Lost</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
            </TextField>
            <TextField label="Bid Amount" fullWidth margin="normal" value={form.bidAmount} onChange={(e) => setForm({ ...form, bidAmount: e.target.value })} placeholder="e.g., ZMW 500,000" />
            <TextField label="Contact Person" fullWidth margin="normal" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <TextField label="Contact Phone" fullWidth margin="normal" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <TextField label="Follow-up Date" type="date" fullWidth margin="normal" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" fullWidth margin="normal" multiline rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add notes about this bid..." />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BiddedProjects;
