import React, { useState, useEffect, useCallback } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, TableContainer, MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#607d8b'];

const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [editForm, setEditForm] = useState({
    project: '',
    items: [],
    supplier: '',
    grandTotal: 0,
    preparedBy: '',
    approvedBy: '',
    authorisedBy: '',
    preparedSign: '',
    approvedSign: '',
    authorisedSign: '',
  });

  const userRole = user?.role;
  const canProcurementApprove = ['admin', 'director', 'procurement-officer', 'accountant'].includes(userRole);
  const canFund = ['admin', 'accountant'].includes(userRole);
  const canEdit = ['admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'].includes(userRole);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get('/api/procurement');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(data);

      const total = data.length;
      const pending = data.filter(o => o.status === 'pending' || o.status === 'procurement_approved').length;
      const funded = data.filter(o => o.status === 'funded').length;
      const purchased = data.filter(o => o.status === 'purchased' || o.status === 'delivered').length;
      
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

  // ─── Chart data ─────────────────────────────────────────────────────
  const statusData = [
    { name: 'Pending', value: stats.pending },
    { name: 'Funded', value: stats.funded },
    { name: 'Purchased', value: stats.purchased },
    { name: 'Other', value: stats.total - stats.pending - stats.funded - stats.purchased },
  ].filter(d => d.value > 0);

  // Monthly spending data (last 6 months)
  const getMonthlyData = () => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[key] = 0;
    }
    orders.forEach(order => {
      if (order.status === 'funded' || order.status === 'purchased') {
        const date = new Date(order.createdAt || order.fundedAt || order.updatedAt);
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (months[key] !== undefined) {
          months[key] += order.grandTotal || order.total || 0;
        }
      }
    });
    return Object.keys(months).map(key => ({
      month: key,
      amount: months[key],
    }));
  };

  const monthlyData = getMonthlyData();

  // ─── Edit handlers ──────────────────────────────────────────────
  const handleEditOpen = (order) => {
    if (!canEdit) return;
    if (order.status !== 'pending') {
      setMessage({ type: 'warning', text: 'Only pending orders can be edited' });
      return;
    }
    setEditingOrder(order);
    setEditForm({
      project: order.project?._id || order.project || '',
      items: order.items || [],
      supplier: order.supplier || '',
      grandTotal: order.grandTotal || order.total || 0,
      preparedBy: order.preparedBy || '',
      approvedBy: order.approvedBy || '',
      authorisedBy: order.authorisedBy || '',
      preparedSign: order.preparedSign || '',
      approvedSign: order.approvedSign || '',
      authorisedSign: order.authorisedSign || '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async (submitForApproval = false) => {
    try {
      if (!editForm.items || editForm.items.length === 0) {
        setMessage({ type: 'error', text: 'Add at least one item.' });
        return;
      }
      const total = editForm.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
      const payload = { ...editForm, grandTotal: total };
      await api.put(`/api/procurement/${editingOrder._id}`, payload);
      
      if (submitForApproval) {
        await api.put(`/api/procurement/${editingOrder._id}/procurement-approve`);
        setMessage({ type: 'success', text: 'Order submitted for approval!' });
      } else {
        setMessage({ type: 'success', text: 'Order updated!' });
      }
      setEditOpen(false);
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Operation failed' });
    }
  };

  const handleAddItem = () => {
    setEditForm({
      ...editForm,
      items: [...editForm.items, { description: '', quantity: 1, unitPrice: 0, supplier: '', notes: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const items = editForm.items.filter((_, i) => i !== index);
    setEditForm({ ...editForm, items });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...editForm.items];
    items[index] = { ...items[index], [field]: value };
    setEditForm({ ...editForm, items });
  };

  // ─── Action handlers ──────────────────────────────────────────────
  const handleProcurementApprove = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/procurement-approve`);
      setMessage({ type: 'success', text: 'Order approved by Procurement Officer!' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  const handleProcurementReject = async (id) => {
    if (!window.confirm('Reject this order?')) return;
    try {
      await api.put(`/api/procurement/${id}/procurement-reject`);
      setMessage({ type: 'success', text: 'Order rejected.' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Rejection failed' });
    }
  };

  const handleFund = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/fund`);
      setMessage({ type: 'success', text: 'Order funded!' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
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
      case 'procurement_approved': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'funded': return 'primary';
      case 'purchased': return 'secondary';
      case 'delivered': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').toUpperCase();
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

      {/* ─── Stats Cards ───────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Orders</Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Pending</Typography>
              <Typography variant="h4" color="#ff9800">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Funded</Typography>
              <Typography variant="h4" color="#2196f3">{stats.funded}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Purchased</Typography>
              <Typography variant="h4" color="#4caf50">{stats.purchased}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Total Spent</Typography>
              <Typography variant="h4" color="#9c27b0">{formatCurrency(stats.totalSpent)}</Typography>
              <Typography variant="caption" display="block">Avg: {formatCurrency(stats.averageOrder)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── Charts ─────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Order Status Distribution</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip formatter={(value) => `${value} orders`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Monthly Spending (ZMW)</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `K${value.toLocaleString()}`} />
                <ChartTooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── Orders Table ───────────────────────────────────────────── */}
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
                    <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell>{order.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleView(order._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      View
                    </Button>

                    {canEdit && order.status === 'pending' && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleEditOpen(order)}
                          sx={{ mr: 0.5, textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleEditOpen(order)}
                          sx={{ mr: 0.5, textTransform: 'none' }}
                        >
                          Submit
                        </Button>
                      </>
                    )}

                    {order.status === 'pending' && canProcurementApprove && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleProcurementApprove(order._id)}
                          sx={{ mr: 0.5, textTransform: 'none' }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleProcurementReject(order._id)}
                          sx={{ mr: 0.5, textTransform: 'none' }}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === 'approved' && canFund && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleFund(order._id)}
                        sx={{ mr: 0.5, textTransform: 'none' }}
                      >
                        Fund
                      </Button>
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

      {/* ─── Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Procurement Order</DialogTitle>
        <DialogContent dividers>
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Items</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem}>Add Item</Button>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editForm.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.description || ''}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={item.quantity || 1}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={item.unitPrice || 0}
                          onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.supplier || ''}
                          onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.notes || ''}
                          onChange={e => handleItemChange(idx, 'notes', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {editForm.items.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center">No items added yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Grand Total: {formatCurrency(
              editForm.items.reduce((sum, item) => sum + ((Number(item.quantity)||0) * (Number(item.unitPrice)||0)), 0)
            )}</Typography>
          </Box>
          <TextField
            label="Prepared By"
            fullWidth
            margin="dense"
            value={editForm.preparedBy}
            onChange={e => setEditForm({ ...editForm, preparedBy: e.target.value })}
          />
          <TextField
            label="Approved By"
            fullWidth
            margin="dense"
            value={editForm.approvedBy}
            onChange={e => setEditForm({ ...editForm, approvedBy: e.target.value })}
          />
          <TextField
            label="Authorised By"
            fullWidth
            margin="dense"
            value={editForm.authorisedBy}
            onChange={e => setEditForm({ ...editForm, authorisedBy: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleEditSave(false)}>Save Draft</Button>
          <Button variant="contained" color="primary" startIcon={<SendIcon />} onClick={() => handleEditSave(true)}>
            Submit for Approval
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcurementDashboard;