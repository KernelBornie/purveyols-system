import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../api/axios';

const ProcurementDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, funded: 0, purchased: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ items: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, projectsRes] = await Promise.all([
        api.get('/api/procurement'),
        api.get('/api/projects'),
      ]);
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      setOrders(ordersData);
      setProjects(projectsData);
      const total = ordersData.length;
      const pending = ordersData.filter(o => o.status === 'pending').length;
      const funded = ordersData.filter(o => o.status === 'funded').length;
      const purchased = ordersData.filter(o => o.status === 'purchased').length;
      setStats({ total, pending, funded, purchased });
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setForm({ items: order.items.map(i => ({ ...i })) });
    setOpenModal(true);
  };

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    if (field === 'unitPrice' || field === 'quantity') {
      const qty = parseFloat(items[index].quantity) || 0;
      const price = parseFloat(items[index].unitPrice) || 0;
      items[index].total = qty * price;
    }
    setForm({ ...form, items });
  };

  const handleSave = async () => {
    try {
      const payload = { ...selectedOrder, items: form.items, status: 'pending' };
      await api.put(`/api/procurement/${selectedOrder._id}`, payload);
      setOpenModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    }
  };

  const handleFund = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/fund`);
      fetchData();
    } catch (err) {
      alert('Failed to fund order');
    }
  };

  const getGrandTotal = (items) => items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Procurement Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>Refresh</Button>
      </Box>
      <Typography variant="subtitle1" gutterBottom>Acquire Materials & Services</Typography>

      {loading ? <CircularProgress /> : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="textSecondary">Total Orders</Typography><Typography variant="h4">{stats.total}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="textSecondary">Pending (blank)</Typography><Typography variant="h4" color="warning.main">{stats.pending}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="textSecondary">Funded</Typography><Typography variant="h4" color="success.main">{stats.funded}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="textSecondary">Purchased</Typography><Typography variant="h4">{stats.purchased}</Typography></CardContent></Card></Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Procurement Orders</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell><TableCell>Items</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Created By</TableCell><TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o._id}>
                    <TableCell>{o.project?.name}</TableCell>
                    <TableCell>{o.items?.length || 0}</TableCell>
                    <TableCell>{getGrandTotal(o.items).toFixed(2)}</TableCell>
                    <TableCell><Chip label={o.status} color={o.status === 'funded' ? 'success' : o.status === 'purchased' ? 'info' : 'warning'} /></TableCell>
                    <TableCell>{o.createdBy?.name}</TableCell>
                    <TableCell>
                      {o.status === 'draft' && <IconButton size="small" onClick={() => handleEdit(o)}><EditIcon fontSize="small" /></IconButton>}
                      {o.status === 'pending' && <Button size="small" color="primary" onClick={() => handleFund(o._id)}>Fund</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
            <DialogTitle>Fill Amounts for Procurement Order</DialogTitle>
            <DialogContent>
              {form.items.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ minWidth: 100 }}>{item.name}</Typography>
                  <TextField label="Qty" type="number" size="small" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} sx={{ width: 80 }} />
                  <TextField label="Unit Price" type="number" size="small" value={item.unitPrice || ''} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} sx={{ width: 120 }} />
                  <TextField label="Total" type="number" size="small" value={item.total || ''} InputProps={{ readOnly: true }} sx={{ width: 120, bgcolor: '#f5f5f5' }} />
                  <TextField label="Supplier" size="small" value={item.supplier || ''} onChange={e => handleItemChange(idx, 'supplier', e.target.value)} sx={{ width: 150 }} />
                </Box>
              ))}
              <Typography variant="h6" sx={{ mt: 2 }}>Grand Total: {getGrandTotal(form.items).toFixed(2)}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save & Submit for Funding</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ProcurementDashboard;
