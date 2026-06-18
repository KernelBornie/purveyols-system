import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip, Card, CardContent,
  FormControlLabel, Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
  const [showSummary, setShowSummary] = useState(true);

  // BOQ Section templates
  const sectionTemplates = [
    {
      name: 'Preliminaries and General Items',
      items: [
        { description: 'Site Establishment', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Site Clearance', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Temporary Works', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Security & Fencing', quantity: 1, unit: 'Lump Sum', rate: 0 },
        { description: 'Welfare Facilities', quantity: 1, unit: 'Lump Sum', rate: 0 },
      ]
    },
    {
      name: 'Boundary Fence Works',
      items: [
        { description: 'Excavation for posts', quantity: 400, unit: 'm³', rate: 0 },
        { description: 'Concrete for posts (C25)', quantity: 80, unit: 'm³', rate: 0 },
        { description: 'Reinforcement steel', quantity: 4000, unit: 'kg', rate: 0 },
        { description: 'Chain link fencing', quantity: 2000, unit: 'm', rate: 0 },
        { description: 'Gates and fittings', quantity: 4, unit: 'No.', rate: 0 },
        { description: 'Painting and finishing', quantity: 2000, unit: 'm', rate: 0 },
      ]
    },
    {
      name: 'Earthworks & Site Preparation',
      items: [
        { description: 'Bulk earthworks', quantity: 500, unit: 'm³', rate: 0 },
        { description: 'Site levelling', quantity: 500, unit: 'm³', rate: 0 },
        { description: 'Drainage works', quantity: 200, unit: 'm', rate: 0 },
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
      // Add default sections with headers
      setForm(prev => ({
        ...prev,
        items: [
          { isSection: true, sectionName: 'PRELIMINARIES AND GENERAL ITEMS' },
          ...sectionTemplates[0].items,
          { isSection: true, sectionName: 'BOUNDARY FENCE WORKS' },
          ...sectionTemplates[1].items,
          { isSection: true, sectionName: 'EARTHWORKS & SITE PREPARATION' },
          ...sectionTemplates[2].items,
        ]
      }));
    }
  }, [id, user]);

  // Calculate totals
  const calculateTotals = () => {
    let itemsWithAmount = [];
    let subtotal = 0;
    
    // Calculate total of all items (excluding sections)
    form.items.forEach(item => {
      if (item.isSection) {
        itemsWithAmount.push(item);
        return;
      }
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = quantity * rate;
      itemsWithAmount.push({ ...item, amount });
      subtotal += amount;
    });
    
    const preliminaries = parseFloat(form.preliminaries) || 0;
    const preliminariesAmount = (subtotal * preliminaries) / 100;
    const contingency = (subtotal + preliminariesAmount) * (parseFloat(form.contingency) / 100);
    const vat = (subtotal + preliminariesAmount + contingency) * (parseFloat(form.vat) / 100);
    const grandTotal = subtotal + preliminariesAmount + contingency + vat;
    
    return { 
      itemsWithAmount, 
      subtotal, 
      preliminariesAmount,
      preliminaries: form.preliminaries,
      contingency: form.contingency,
      vat: form.vat,
      contingencyAmount: contingency,
      vatAmount: vat,
      grandTotal 
    };
  };

  const totals = calculateTotals();

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    if (field === 'isSection') {
      items[index][field] = value;
    } else {
      items[index][field] = value;
      // Auto-calculate amount when quantity or rate changes
      const quantity = parseFloat(items[index].quantity) || 0;
      const rate = parseFloat(items[index].rate) || 0;
      items[index].amount = quantity * rate;
    }
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
      items: [
        ...form.items,
        { isSection: true, sectionName: sectionName.toUpperCase() },
        ...newItems
      ]
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
        preliminaries: form.preliminaries,
        contingency: form.contingency,
        vat: form.vat,
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

  const exportCSV = () => {
    let csv = 'Description,Qty,Unit,Rate,Amount\n';
    form.items.forEach(item => {
      if (!item.isSection) {
        csv += `${item.description},${item.quantity},${item.unit},${item.rate},${item.amount}\n`;
      }
    });
    csv += `\nSub-Total,,,${totals.subtotal}`;
    csv += `\nPreliminaries (${totals.preliminaries}%),,,"${totals.preliminariesAmount}"`;
    csv += `\nContingency (${totals.contingency}%),,,"${totals.contingencyAmount}"`;
    csv += `\nVAT (${totals.vat}%),,,"${totals.vatAmount}"`;
    csv += `\nGRAND TOTAL,,,${totals.grandTotal}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BOQ.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <BackButton />
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Bill of Quantities (BOQ)</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV}>
            Export CSV
          </Button>
        </Box>
      </Box>
      
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Created by' : 'Created by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Project and Description */}
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
              label="Description / Title"
              fullWidth
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Proposed Construction of 2000m Long Boundary Fence"
            />
          </Grid>
        </Grid>

        {/* Quick Add Sections */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
            onClick={() => addSection('Earthworks', sectionTemplates[2].items)}
          >
            Add Earthworks
          </Button>
          <Button
            variant="contained"
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
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
              {totals.itemsWithAmount.map((item, idx) => {
                if (item.isSection) {
                  return (
                    <TableRow key={idx}>
                      <TableCell colSpan={7}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ bgcolor: '#e3f2fd', p: 1 }}>
                          {item.sectionName}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
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
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Summary Section */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            
            <Card sx={{ p: 2, bgcolor: '#f9f9f9' }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Sub-Total:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="bold">{formatCurrency(totals.subtotal)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Preliminaries ({totals.preliminaries}%):</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{formatCurrency(totals.preliminariesAmount)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Contingency ({totals.contingency}%):</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{formatCurrency(totals.contingencyAmount)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">VAT ({totals.vat}%):</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{formatCurrency(totals.vatAmount)}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6">GRAND TOTAL:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(totals.grandTotal)}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Box>

          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Typography variant="h6" gutterBottom>Settings</Typography>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <TextField
                label="Preliminaries (%)"
                type="number"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={form.preliminaries}
                onChange={e => setForm({ ...form, preliminaries: e.target.value })}
              />
              <TextField
                label="Contingency (%)"
                type="number"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={form.contingency}
                onChange={e => setForm({ ...form, contingency: e.target.value })}
              />
              <TextField
                label="VAT (%)"
                type="number"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={form.vat}
                onChange={e => setForm({ ...form, vat: e.target.value })}
              />
              <TextField
                select
                label="Status"
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
          </Box>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save BOQ'}
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
