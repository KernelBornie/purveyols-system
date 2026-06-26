import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const FundingRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // ─── Modal state ────────────────────────────────────────────────
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundingToFund, setFundingToFund] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');

  const canApprove = ['admin', 'director', 'accountant'].includes(user?.role);
  const canFund = ['admin', 'accountant'].includes(user?.role);
  const canDelete = ['admin', 'director', 'accountant'].includes(user?.role);
  const canEdit = ['admin', 'director', 'accountant', 'civil-engineer', 'quantity-surveyor', 'foreman', 'driver', 'safety-officer', 'procurement-officer'].includes(user?.role);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/funding-requests');
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load funding requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/funding-requests/${id}/reject`, { reason });
      fetchRequests();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleFund = async (id, phone) => {
    try {
      await api.put(`/api/funding-requests/${id}/fund`, { recipientPhone: phone });
      fetchRequests();
    } catch (err) {
      alert('Funding failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request permanently?')) return;
    try {
      await api.delete(`/api/funding-requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openFundModal = (request) => {
    setFundingToFund(request);
    setRecipientPhone(request.recipientPhone || '');
    setFundModalOpen(true);
  };

  const handleFundConfirm = async () => {
    if (!recipientPhone || recipientPhone.trim() === '') {
      alert('Please enter a valid phone number.');
      return;
    }
    await handleFund(fundingToFund._id, recipientPhone);
    setFundModalOpen(false);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Funding Requests</Typography>
        {canEdit && (
          <Button component={Link} to="/funding/new" variant="contained" startIcon={<AddIcon />}>
            New Request
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Project</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requested By</TableCell>
            <TableCell>Approved By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.project?.name || 'N/A'}</TableCell>
              <TableCell>K {r.amount?.toLocaleString() || 0}</TableCell>
              <TableCell>
                <Chip
                  label={r.status}
                  color={r.status === 'funded' ? 'info' : r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : r.status === 'draft' ? 'default' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell>{r.requestedBy?.name || 'N/A'}</TableCell>
              <TableCell>{r.approvedBy?.name || '—'}</TableCell>
              <TableCell>
                {/* ─── View button (text) ──────────────────────────── */}
                <Button
                  component={Link}
                  to={`/funding/${r._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {/* ─── Edit ────────────────────────────────────────── */}
                {canEdit && (r.status === 'draft' || r.status === 'pending') && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/funding/${r._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* ─── Delete ───────────────────────────────────────── */}
                {canDelete && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(r._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* ─── Approve/Reject ──────────────────────────────── */}
                {canApprove && r.status === 'pending' && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApprove(r._id)}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleReject(r._id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {/* ─── Fund button (text) ──────────────────────────── */}
                {canFund && r.status === 'approved' && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => openFundModal(r)}
                    sx={{ ml: 0.5 }}
                  >
                    Fund
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">No funding requests yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ─── Funding Modal ────────────────────────────────────────── */}
      <Dialog open={fundModalOpen} onClose={() => setFundModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fund Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to fund <strong>{fundingToFund?.project?.name || 'N/A'}</strong> for <strong>K {fundingToFund?.amount?.toLocaleString() || 0}</strong>.
          </Typography>
          <TextField
            label="Recipient Phone (Airtel Money)"
            fullWidth
            margin="normal"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="e.g., 0971234567"
            helperText="The phone number that will receive the funds."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleFundConfirm}>
            Confirm & Send Money
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FundingRequestList;