import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip, Card, CardContent,
  FormControl, InputLabel, Select, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProcurementOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    items: [],
    status: 'pending',
    orderNumber: '',
    preparedBy: '',
    approvedBy: '',
    authorisedBy: '',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO-${year}${month}${day}-${random}`;
  };

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
    api.get('/api/suppliers').then(res => setSuppliers(res.data || []));
    
    if (id) {
      api.get(`/api/procurement/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.createdBy);
      });
    } else {
      setCreator(user);
      setForm(prev => ({
        ...prev,
        orderNumber: generateOrderNumber(),
        preparedBy: user?.name || '',
        items: [
          { 
            description: '', 
            unit: '', 
            quantity: 1, 
            unitPrice: 0, 
            total: 0,
            supplier: ''
          }
        ]
      }));
    }
  }, [id, user]);

  // Calculate totals
  const calculateTotals = () => {
    let itemsWithTotal = [];
    let grandTotal = 0;
    
    form.items.forEach(item => {
      if (!item.description) {
        itemsWithTotal.push({ ...item, total: 0 });
        return;
      }
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
    const items = [...form.items];
    items[index][field] = value;
    
    // Auto-calculate total when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(items[index].quantity) || 0;
      const unitPrice = parseFloat(items[index].unitPrice) || 0;
      items[index].total = quantity * unitPrice;
    }
    
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { 
          description: '', 
          unit: '', 
          quantity: 1, 
          unitPrice: 0, 
          total: 0,
          supplier: ''
        }
      ]
    });
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) {
      setMessage({ type: 'warning', text: 'Must have at least one item.' });
      return;
    }
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const itemsToSubmit = totals.itemsWithTotal.map(item => ({
        description: item.description,
        unit: item.unit || 'Each',
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.total) || 0,
        supplier: item.supplier || '',
      }));
      
      const payload = {
        ...form,
        items: itemsToSubmit,
        grandTotal: totals.grandTotal,
      };
      
      if (id) {
        await api.put(`/api/procurement/${id}`, payload);
        setMessage({ type: 'success', text: 'Procurement order updated successfully!' });
      } else {
        await api.post('/api/procurement', payload);
        setMessage({ type: 'success', text: 'Procurement order created successfully!' });
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

  return (
    <Paper sx={{ p: 3 }}>
      <BackButton />
      
      {/* Company Header - Matching Physical Requisition Note */}
      <Box sx={{ 
        textAlign: 'center', 
        borderBottom: '2px solid #1976d2', 
        pb: 2, 
        mb: 3,
        '@media print': {
          borderBottom: '2px solid #000',
        }
      }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          PURVEYOLS
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Building and Civil Construction
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Plot No. 8, Buchi Road - Northwood, P.O. Box NH 87 Lucknow, Zanzibar
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Email: purveyols@gmail.com
        </Typography>
      </Box>

      {/* Document Title */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        borderBottom: '1px solid #e0e0e0',
        pb: 1
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          MATERIAL REQUISITION NOTE
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          No. {form.orderNumber || 'NEW'}
        </Typography>
      </Box>
      
      {/* Creator Info */}
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Created by' : 'Created by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Project Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Project"
              fullWidth
              value={form.project}
              onChange={e => setForm({ ...form, project: e.target.value })}
              required
            >
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Order Number"
              fullWidth
              value={form.orderNumber}
              onChange={e => setForm({ ...form, orderNumber: e.target.value })}
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: '#f5f5f5' }}
            />
          </Grid>
        </Grid>

        {/* Requested Materials/Items Table */}
        <Box sx={{ mt: 3, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Requested Materials/Items</Typography>
          
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>UNIT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>UNIT PRICE (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SUPPLIER</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {totals.itemsWithTotal.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="e.g., Cement"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.unit}
                      onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                      sx={{ width: 80 }}
                      placeholder="Bags"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 70 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                      sx={{ width: 120 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.total || 0}
                      InputProps={{ readOnly: true }}
                      sx={{ width: 120, bgcolor: '#f5f5f5' }}
                      inputProps={{ step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.supplier}
                      onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                      sx={{ width: 130 }}
                      placeholder="Supplier"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Add Item Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addItem}
          >
            Add Item
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Grand Total */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          mb: 3
        }}>
          <Card sx={{ p: 3, bgcolor: '#f9f9f9', minWidth: 300 }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
              GRAND TOTAL: {formatCurrency(totals.grandTotal)}
            </Typography>
          </Card>
        </Box>

        {/* Approval Section - Matching Physical Requisition Note */}
        <Box sx={{ 
          mt: 4,
          borderTop: '1px solid #e0e0e0',
          pt: 3,
          '@media print': {
            borderTop: '1px solid #000',
          }
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            APPROVAL SECTION
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                label="PREPARED BY"
                fullWidth
                value={form.preparedBy || user?.name || ''}
                onChange={e => setForm({ ...form, preparedBy: e.target.value })}
                size="small"
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">SIGN: _______________</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="APPROVED BY"
                fullWidth
                value={form.approvedBy || ''}
                onChange={e => setForm({ ...form, approvedBy: e.target.value })}
                size="small"
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">SIGN: _______________</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="AUTHORISED BY"
                fullWidth
                value={form.authorisedBy || ''}
                onChange={e => setForm({ ...form, authorisedBy: e.target.value })}
                size="small"
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">SIGN: _______________</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Status */}
        <Box sx={{ mt: 3 }}>
          <TextField
            select
            label="Status"
            size="small"
            sx={{ width: 200 }}
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="funded">Funded</MenuItem>
            <MenuItem value="purchased">Purchased</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </TextField>
          {form.status === 'pending' && (
            <Chip label="Pending Approval" color="warning" sx={{ ml: 2 }} />
          )}
          {form.status === 'funded' && (
            <Chip label="Funded" color="info" sx={{ ml: 2 }} />
          )}
          {form.status === 'purchased' && (
            <Chip label="Purchased" color="success" sx={{ ml: 2 }} />
          )}
          {form.status === 'delivered' && (
            <Chip label="Delivered" color="primary" sx={{ ml: 2 }} />
          )}
        </Box>

        {/* Actions */}
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

export default ProcurementOrderForm;
