import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const FundingRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canApprove = ['admin', 'director', 'accountant'].includes(user?.role);
  const canEdit = ['admin', 'director', 'civil-engineer', 'quantity-surveyor', 'foreman', 'driver', 'safety-officer', 'procurement-officer', 'accountant'].includes(user?.role);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/api/funding-requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Delete failed');
    }
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
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.project?.name || 'N/A'}</TableCell>
              <TableCell>{r.amount}</TableCell>
              <TableCell>
                <Chip
                  label={r.status}
                  color={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell>{r.requestedBy?.name || 'N/A'}</TableCell>
              <TableCell>
                <Tooltip title="View">
                  <IconButton component={Link} to={`/funding/${r._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canEdit && r.status === 'pending' && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton component={Link} to={`/funding/${r._id}/edit`} size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(r._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {canApprove && r.status === 'pending' && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton size="small" color="success" onClick={() => handleApprove(r._id)}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton size="small" color="error" onClick={() => handleReject(r._id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">No funding requests yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default FundingRequestList;