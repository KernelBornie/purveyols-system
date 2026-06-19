import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, CircularProgress, Alert, IconButton, Tooltip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import api from '../api/axios';
import BackButton from '../components/BackButton';

const DeliveryNotes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get('/api/procurement');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Filter to show orders that are funded, purchased, or delivered (i.e., delivery relevant)
      const deliveryOrders = data.filter(o => 
        ['funded', 'purchased', 'delivered'].includes(o.status)
      );
      setOrders(deliveryOrders);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleMarkDelivered = async (id) => {
    if (!window.confirm('Mark this order as delivered?')) return;
    try {
      await api.put(`/api/procurement/${id}/deliver`);
      setMessage({ type: 'success', text: 'Order marked as delivered!' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update status' });
    }
  };

  const handleAddDeliveryNote = (order) => {
    setSelectedOrder(order);
    setDeliveryNote('');
    setOpenDialog(true);
  };

  const handleSaveDeliveryNote = async () => {
    if (!deliveryNote.trim()) {
      setMessage({ type: 'warning', text: 'Please enter a delivery note.' });
      return;
    }
    try {
      await api.put(`/api/procurement/${selectedOrder._id}/add-note`, { deliveryNote });
      setMessage({ type: 'success', text: 'Delivery note added!' });
      setOpenDialog(false);
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add note' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'funded': return 'info';
      case 'purchased': return 'primary';
      case 'delivered': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Delivery Notes</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchOrders}>
          Refresh
        </Button>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? <CircularProgress /> : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Pending & Completed Deliveries</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order No.</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Delivery Note</TableCell>
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
                  <TableCell>
                    {order.deliveryNote || '—'}
                  </TableCell>
                  <TableCell>
                    {order.status !== 'delivered' && (
                      <Tooltip title="Mark as Delivered">
                        <IconButton size="small" color="success" onClick={() => handleMarkDelivered(order._id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Add Delivery Note">
                      <IconButton size="small" color="primary" onClick={() => handleAddDeliveryNote(order)}>
                        <LocalShippingIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No delivery orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Add Delivery Note Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Delivery Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Order: {selectedOrder?.orderNumber} – {selectedOrder?.project?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Delivery Note / Remarks"
            fullWidth
            multiline
            rows={3}
            value={deliveryNote}
            onChange={e => setDeliveryNote(e.target.value)}
            placeholder="e.g., Goods delivered to site, received by John."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDeliveryNote}>Save Note</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryNotes;
