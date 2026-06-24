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
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProcurementList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canFund = ['admin', 'director', 'accountant'].includes(user?.role);
  const canEdit = ['admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'].includes(user?.role);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/procurement');
      setOrders(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/fund`);
      fetchOrders();
    } catch (err) {
      alert('Fund action failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this procurement order?')) return;
    try {
      await api.put(`/api/procurement/${id}/reject`);
      fetchOrders();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api.delete(`/api/procurement/${id}`);
      fetchOrders();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => ({
    pending: 'warning',
    funded: 'info',
    purchased: 'success',
    delivered: 'primary'
  }[status] || 'default');

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Material Requisition Notes</Typography>
        {canEdit && (
          <Button component={Link} to="/procurement/new" variant="contained" startIcon={<AddIcon />}>
            New Requisition
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Prepared By</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No requisition notes yet.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            orders.map(o => (
              <TableRow key={o._id}>
                <TableCell>{o.orderNumber || o._id.slice(-6)}</TableCell>
                <TableCell>{o.project?.name}</TableCell>
                <TableCell>{o.items?.length || 0}</TableCell>
                <TableCell>K {o.grandTotal?.toLocaleString() || '0.00'}</TableCell>
                <TableCell>
                  <Chip label={o.status} size="small" color={getStatusColor(o.status)} />
                </TableCell>
                <TableCell>{o.preparedBy || o.createdBy?.name}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton component={Link} to={`/procurement/${o._id}`} size="small">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canEdit && o.status === 'pending' && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton component={Link} to={`/procurement/${o._id}/edit`} size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(o._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {canFund && o.status === 'pending' && (
                    <>
                      <Tooltip title="Fund">
                        <IconButton size="small" color="success" onClick={() => handleFund(o._id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => handleReject(o._id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Print">
                    <IconButton size="small" onClick={() => window.print()}>
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProcurementList;