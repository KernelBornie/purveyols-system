import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    items: [],
    status: 'pending',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const orderRes = await api.get(`/api/procurement/${id}`);
          const data = orderRes.data;
          setForm({
            project: data.project || '',
            items: Array.isArray(data.items) ? data.items : [],
            status: data.status || 'pending',
          });
          setCreator(data.createdBy);
        } else {
          setCreator(user);
          setForm(prev => ({
            ...prev,
            items: [
              { description: '', quantity: 1, unitPrice: 0, total: 0, supplier: '' }
            ]
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };

    fetchData();
  }, [id, user]);

  const calculateTotals = () => {
    const items = Array.isArray(form.items) ? form.items : [];
    let itemsWithTotal = [];
    let grandTotal = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = quantity * unitPrice;
      itemsWithTotal.push({ ...item, total });
      grandTotal += total;
    });

    return { itemsWithTotal, grandTotal };
  };

  const totals = calculateTotals();

  const handleItemChange = (index, field, value) => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    if (!items[index]) return;

    items[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(items[index].quantity) || 0;
      const unitPrice = parseFloat(items[index].unitPrice) || 0;
      items[index].total = quantity * unitPrice;
    }

    setForm({ ...form, items });
  };

  const addItem = () => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    setForm({
      ...form,
      items: [
        ...items,
        { description: '', quantity: 1, unitPrice: 0, total: 0, supplier: '' }
      ]
    });
  };

  const removeItem = (index) => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    if (items.length <= 1) {
      setMessage({ type: 'warning', text: 'Must have at least one item.' });
      return;
    }
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const items = Array.isArray(form.items) ? form.items : [];
      const payload = {
        project: form.project,
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
          supplier: item.supplier || '',
        })),
        status: form.status,
        grandTotal: totals.grandTotal,
      };

      if (id) {
        await api.put(`/api/procurement/${id}`, payload);
        setMessage({ type: 'success', text: 'Order updated successfully!' });
      } else {
        await api.post('/api/procurement', payload);
        setMessage({ type: 'success', text: 'Order created successfully!' });
      }
      setTimeout(() => navigate('/procurement'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save order' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const items = Array.isArray(form.items) ? form.items : [];

  return (
    <Paper sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
      <BackButton />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          New Procurement Order {id ? '(Edit)' : '(blank amounts)'}
        </Typography>

        {/* Creator Info */}
        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by (you): <strong>{creator.name}</strong> ({creator.role})
            </Typography>
          </Box>
        )}

        {/* Project Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              select
              label="Project *"
              fullWidth
              size="small"
              value={form.project || ''}
              onChange={e => setForm({ ...form, project: e.target.value })}
              required
            >
              {Array.isArray(projects) && projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Requested Materials/Items Table */}
        <Box sx={{ mt: 2, overflowX: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Requested Materials/Items
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Unit Price (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                    No items added yet. Click "Add Row" to add items.
                  </TableCell>
                </TableRow>
              ) : (
                totals.itemsWithTotal.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.description || ''}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="e.g., Cement"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.quantity || 0}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.unitPrice || 0}
                        onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.total || 0}
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.supplier || ''}
                        onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                        placeholder="Supplier"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Add Item Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addItem}
            size="small"
          >
            Add Row
          </Button>
        </Box>

        {/* Grand Total */}
        <Box sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e0e0e0',
          pt: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Grand Total: {formatCurrency(totals.grandTotal)}
          </Typography>
        </Box>

        {/* Status and Actions */}
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Status"
            size="small"
            sx={{ width: 150 }}
            value={form.status || 'pending'}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="funded">Funded</MenuItem>
            <MenuItem value="purchased">Purchased</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </TextField>
          {form.status === 'pending' && <Chip label="Pending" color="warning" size="small" />}
          {form.status === 'funded' && <Chip label="Funded" color="info" size="small" />}
          {form.status === 'purchased' && <Chip label="Purchased" color="success" size="small" />}
          {form.status === 'delivered' && <Chip label="Delivered" color="primary" size="small" />}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Order'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/procurement')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ProcurementForm;
