import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import DeliveryNote from '../../components/DeliveryNote';

const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    funded: 0,
    purchased: 0,
    totalSpent: 0,
    averageOrder: 0,
  });
  const [message, setMessage] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ project: '', items: [], total: 0, supplier: '' });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get('/api/procurement');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(data);

      const total = data.length;
      const pending = data.filter(o => o.status === 'pending').length;
      const funded = data.filter(o => o.status === 'funded').length;
      const purchased = data.filter(o => o.status === 'purchased').length;
      
      const totalSpent = data
        .filter(o => o.status === 'funded' || o.status === 'purchased')
        .reduce((sum, o) => sum + (o.grandTotal || o.total || 0), 0);
      
      const averageOrder = total > 0 ? totalSpent / total : 0;

      setStats({
        total,
        pending,
        funded,
        purchased,
        totalSpent,
        averageOrder,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this procurement order?')) return;
    try {
      await api.put(`/api/procurement/${id}/approve`);
      setMessage({ type: 'success', text: 'Order approved!' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this procurement order?')) return;
    try {
      await api.put(`/api/procurement/${id}/reject`);
      setMessage({ type: 'success', text: 'Order rejected.' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Rejection failed' });
    }
  };

  const handleEditOpen = (order) => {
    setEditingOrder(order);
    setEditForm({
      project: order.project?._id || order.project || '',
      items: order.items || [],
      total: order.grandTotal || order.total || 0,
      supplier: order.supplier || '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/api/procurement/${editingOrder._id}`, editForm);
      setEditOpen(false);
      setMessage({ type: 'success', text: 'Order updated!' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    }
  };

  const handleView = (id) => {
    navigate(`/procurement/${id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'funded': return 'info';
      case 'purchased': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Procurement Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchOrders}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Typography variant="h6" gutterBottom>Acquire Materials & Services</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card><CardContent>
            <Typography variant="body2" color="textSecondary">Total Orders</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}><CardContent>
            <Typography variant="body2" color="textSecondary">Pending</Typography>
            <Typography variant="h4">{stats.pending}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}><CardContent>
            <Typography variant="body2" color="textSecondary">Funded</Typography>
            <Typography variant="h4">{stats.funded}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #4caf50' }}><CardContent>
            <Typography variant="body2" color="textSecondary">Purchased</Typography>
            <Typography variant="h4">{stats.purchased}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #9c27b0' }}><CardContent>
            <Typography variant="body2" color="textSecondary">Total Spent</Typography>
            <Typography variant="h4">{formatCurrency(stats.totalSpent)}</Typography>
            <Typography variant="caption" display="block">Avg. Order: {formatCurrency(stats.averageOrder)}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {loading ? <CircularProgress /> : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Procurement Orders</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order No.</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber || order._id.slice(-6)}</TableCell>
                  <TableCell>{order.project?.name || 'N/A'}</TableCell>
                  <TableCell>{order.items?.length || 0}</TableCell>
                  <TableCell>{formatCurrency(order.grandTotal || order.total || 0)}</TableCell>
                  <TableCell>
                    <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell>{order.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleView(order._id)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditOpen(order)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {order.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton size="small" color="success" onClick={() => handleApprove(order._id)}>
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton size="small" color="error" onClick={() => handleReject(order._id)}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No procurement orders</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Procurement Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Project ID"
            fullWidth
            margin="dense"
            value={editForm.project}
            onChange={e => setEditForm({ ...editForm, project: e.target.value })}
          />
          <TextField
            label="Supplier"
            fullWidth
            margin="dense"
            value={editForm.supplier}
            onChange={e => setEditForm({ ...editForm, supplier: e.target.value })}
          />
          <TextField
            label="Total Amount (ZMW)"
            type="number"
            fullWidth
            margin="dense"
            value={editForm.total}
            onChange={e => setEditForm({ ...editForm, total: parseFloat(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcurementDashboard;
