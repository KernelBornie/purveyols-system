import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const BOQForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    items: [],
    status: 'draft',
    contingency: 2.0,
    vat: 16,
    preliminaries: 0,
    description: '',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  // BOQ Section templates
  const sectionTemplates = [
    {
      name: 'Preliminaries and General Items',
      items: [
        { description: 'Site Establishment', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Site Clearance', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Temporary Works', quantity: 1, unit: 'Lump Sum', rate: 0 },
      ]
    },
    {
      name: 'Boundary Fence',
      items: [
        { description: 'Excavation for posts', quantity: 400, unit: 'm³', rate: 0 },
        { description: 'Concrete for posts (C25)', quantity: 80, unit: 'm³', rate: 0 },
        { description: 'Reinforcement steel', quantity: 4000, unit: 'kg', rate: 0 },
        { description: 'Chain link fencing', quantity: 2000, unit: 'm', rate: 0 },
        { description: 'Gates and fittings', quantity: 4, unit: 'No.', rate: 0 },
      ]
    }
  ];

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
    if (id) {
      api.get(`/api/boq/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.createdBy);
      });
    } else {
      setCreator(user);
      // Add default sections
      setForm(prev => ({
        ...prev,
        items: [
          ...sectionTemplates[0].items,
          ...sectionTemplates[1].items,
        ]
      }));
    }
  }, [id, user]);

  // Calculate totals
  const calculateTotals = () => {
    const itemsWithAmount = form.items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = quantity * rate;
      return { ...item, amount };
    });
    
    const subtotal = itemsWithAmount.reduce((sum, item) => sum + (item.amount || 0), 0);
    const preliminaries = parseFloat(form.preliminaries) || 0;
    const contingency = (subtotal + preliminaries) * (parseFloat(form.contingency) / 100);
    const vat = (subtotal + preliminaries + contingency) * (parseFloat(form.vat) / 100);
    const grandTotal = subtotal + preliminaries + contingency + vat;
    
    return { itemsWithAmount, subtotal, preliminaries, contingency, vat, grandTotal };
  };

  const totals = calculateTotals();

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit: '', rate: 0, amount: 0 }]
    });
  };

  const addSection = (sectionName, templateItems) => {
    const newItems = templateItems.map(item => ({
      ...item,
      amount: 0
    }));
    setForm({
      ...form,
      items: [...form.items, ...newItems]
    });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const itemsToSubmit = totals.itemsWithAmount.map(item => ({
        ...item,
        amount: parseFloat(item.amount) || 0,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
      }));
      
      const payload = {
        ...form,
        items: itemsToSubmit,
        preliminaries: totals.preliminaries,
        contingency: totals.contingency,
        vat: totals.vat,
        grandTotal: totals.grandTotal,
      };
      
      if (id) {
        await api.put(`/api/boq/${id}`, payload);
        setMessage({ type: 'success', text: 'BOQ updated successfully!' });
      } else {
        await api.post('/api/boq', payload);
        setMessage({ type: 'success', text: 'BOQ created successfully!' });
      }
      setTimeout(() => navigate('/boq'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save BOQ' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <BackButton />
      <Typography variant="h4" gutterBottom>Bill of Quantities (BOQ)</Typography>
      
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
        <Grid container spacing={2}>
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
              label="Description / Title"
              fullWidth
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Proposed Construction of 2000m Long Boundary Fence"
            />
          </Grid>
        </Grid>

        {/* Quick Add Sections */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => addSection('Preliminaries', sectionTemplates[0].items)}
          >
            Add Preliminaries
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => addSection('Boundary Fence', sectionTemplates[1].items)}
          >
            Add Boundary Fence
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addItem}
          >
            Add Custom Item
          </Button>
        </Box>

        {/* BOQ Items Table */}
        <Box sx={{ mt: 3, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>BOQ Items</Typography>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rate (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {totals.itemsWithAmount.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Item description..."
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.unit}
                      onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                      sx={{ width: 80 }}
                      placeholder="m², m³, No."
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.rate}
                      onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.amount || 0}
                      InputProps={{ readOnly: true }}
                      sx={{ width: 120, bgcolor: '#f5f5f5' }}
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

        <Divider sx={{ my: 3 }} />

        {/* Summary Section */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body1">Sub-Total:</Typography>
              <Typography variant="body1" fontWeight="bold">
                ZMW {totals.subtotal.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Typography variant="body1">Preliminaries (%):</Typography>
              <TextField
                size="small"
                type="number"
                value={form.preliminaries}
                onChange={e => setForm({ ...form, preliminaries: e.target.value })}
                sx={{ width: 100 }}
              />
              <Typography variant="body1" fontWeight="bold">
                ZMW {totals.preliminaries.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Typography variant="body1">Contingency (%):</Typography>
              <TextField
                size="small"
                type="number"
                value={form.contingency}
                onChange={e => setForm({ ...form, contingency: e.target.value })}
                sx={{ width: 100 }}
              />
              <Typography variant="body1" fontWeight="bold">
                ZMW {totals.contingency.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Typography variant="body1">VAT (%):</Typography>
              <TextField
                size="small"
                type="number"
                value={form.vat}
                onChange={e => setForm({ ...form, vat: e.target.value })}
                sx={{ width: 100 }}
              />
              <Typography variant="body1" fontWeight="bold">
                ZMW {totals.vat.toFixed(2)}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
              <Typography variant="h5">GRAND TOTAL:</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ZMW {totals.grandTotal.toFixed(2)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Status</Typography>
              <TextField
                select
                size="small"
                fullWidth
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </TextField>
              
              {form.status === 'submitted' && (
                <Chip label="Pending Approval" color="warning" sx={{ mt: 2 }} />
              )}
              {form.status === 'approved' && (
                <Chip label="Approved" color="success" sx={{ mt: 2 }} />
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save BOQ'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/boq')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default BOQForm;
