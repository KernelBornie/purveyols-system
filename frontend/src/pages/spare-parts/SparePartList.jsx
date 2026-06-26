import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const SparePartList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canEdit = ['driver', 'procurement-officer', 'director', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/spare-parts');
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load spare parts requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/api/spare-parts/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'error';
    return 'warning';
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Spare Parts Requests</Typography>
        {(user?.role === 'driver' || user?.role === 'admin' || user?.role === 'director' || user?.role === 'procurement-officer') && (
          <Button component={Link} to="/spare-parts/new" variant="contained" startIcon={<AddIcon />}>
            New Request
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Item</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requested By</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req._id}>
              <TableCell>{req.item}</TableCell>
              <TableCell>{req.quantity}</TableCell>
              <TableCell>{req.description || '-'}</TableCell>
              <TableCell>{req.project?.name || '-'}</TableCell>
              <TableCell>
                <Chip label={req.status} size="small" color={getStatusColor(req.status)} />
              </TableCell>
              <TableCell>{req.driver?.name}</TableCell>
              <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                {/* ─── View button (text) ──────────────────────────── */}
                <Button
                  component={Link}
                  to={`/spare-parts/${req._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {canEdit && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton
                        component={Link}
                        to={`/spare-parts/${req._id}/edit`}
                        size="small"
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(req._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No spare parts requests yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default SparePartList;