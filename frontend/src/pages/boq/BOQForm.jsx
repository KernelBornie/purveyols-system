import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip, Card, CircularProgress
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
  const [loading, setLoading] = useState(true);
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

  // ✅ Foreman added
  const canEdit = ['civil-engineer', 'quantity-surveyor', 'procurement-officer', 'director', 'admin', 'accountant', 'foreman'].includes(user?.role);

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const boqRes = await api.get(`/api/boq/${id}`);
          const data = boqRes.data;
          setForm({
            project: data.project?._id || data.project || '',
            items: Array.isArray(data.items) ? data.items : [],
            status: data.status || 'draft',
            contingency: data.contingency || 2.0,
            vat: data.vat || 16,
            preliminaries: data.preliminaries || 0,
            description: data.description || '',
          });
          setCreator(data.createdBy);
        } else {
          setCreator(user);
          const initialItems = [
            { isSection: true, sectionName: 'PRELIMINARIES AND GENERAL ITEMS' },
            ...sectionTemplates[0].items,
            { isSection: true, sectionName: 'BOUNDARY FENCE WORKS' },
            ...sectionTemplates[1].items,
            { isSection: true, sectionName: 'EARTHWORKS & SITE PREPARATION' },
            ...sectionTemplates[2].items,
          ];
          setForm(prev => ({ ...prev, items: initialItems }));
        }
        setMessage(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const calculateTotals = () => {
    let itemsWithAmount = [];
    let subtotal = 0;
    const items = Array.isArray(form.items) ? form.items : [];

    items.forEach(item => {
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
      preliminaries,
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
      const quantity = parseFloat(items[index].quantity) || 0;
      const rate = parseFloat(items[index].rate) || 0;
      items[index].amount = quantity * rate;
    }
    setForm({ ...form, items });
  };

  const addItem = () => {
    if (!canEdit) return;
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit: '', rate: 0, amount: 0 }]
    });
  };

  const addSection = (sectionName, templateItems) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
    const items = form.items.filter((_, i) => i !== index);
    if (items.length === 0) {
      setMessage({ type: 'warning', text: 'Must have at least one item.' });
      return;
    }
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage(null);
    try {
      const itemsToSubmit = totals.itemsWithAmount.map(item => {
        if (item.isSection) return item;
        return {
          ...item,
          amount: parseFloat(item.amount) || 0,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
        };
      });

      const payload = {
        project: form.project,
        description: form.description,
        items: itemsToSubmit,
        preliminaries: parseFloat(form.preliminaries) || 0,
        contingency: parseFloat(form.contingency) || 0,
        vat: parseFloat(form.vat) || 0,
        status: form.status,
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

  const handleDelete = async () => {
    if (!canEdit) return;
    if (!window.confirm('Delete this BOQ?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/boq/${id}`);
      navigate('/boq');
    } catch (err) {
      alert('Delete failed');
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

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

  const items = Array.isArray(form.items) ? form.items : [];

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: '1100px', mx: 'auto' }}>
      <BackButton />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access.</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Company Header */}
        <Box sx={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          pb: 2,
          mb: 2,
          '@media print': { borderBottom: '2px solid #000' }
        }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
            PURVEYOLS
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Building and Civil Construction
          </Typography>
          <Typography variant="body2">
            Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia
          </Typography>
          <Typography variant="body2">
            Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879
          </Typography>
          <Typography variant="body2">
            Email: purveyols@gmail.com
          </Typography>
        </Box>

        {/* Document Title */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          borderBottom: '1px solid #000',
          pb: 1
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            BILL OF QUANTITIES (BOQ)
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `BOQ #${id.slice(-6)}` : 'New BOQ'}
          </Typography>
        </Box>

        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by (you): <strong>{creator.name}</strong> ({creator.role})
            </Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Project *"
              fullWidth
              size="small"
              value={form.project || ''}
              onChange={e => setForm({ ...form, project: e.target.value })}
              required
              disabled={!canEdit}
            >
              {Array.isArray(projects) && projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Description / Title"
              fullWidth
              size="small"
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Proposed Construction of 2000m Long Boundary Fence"
              disabled={!canEdit}
            />
          </Grid>
        </Grid>

        {canEdit && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addSection('Preliminaries', sectionTemplates[0].items)}>
              Add Preliminaries
            </Button>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addSection('Boundary Fence', sectionTemplates[1].items)}>
              Add Boundary Fence
            </Button>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addSection('Earthworks', sectionTemplates[2].items)}>
              Add Earthworks
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addItem}>
              Add Custom Item
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 3, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>BOQ Items</Typography>
          <Table size="small" sx={{ border: '1px solid #000' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '80px' }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '100px' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '120px' }}>Rate (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '120px' }}>Amount (ZMW)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '60px' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, border: '1px solid #000' }}>
                    No items added yet.
                  </TableCell>
                </TableRow>
              ) : (
                totals.itemsWithAmount.map((item, idx) => {
                  if (item.isSection) {
                    return (
                      <TableRow key={idx}>
                        <TableCell colSpan={7} sx={{ border: '1px solid #000' }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ bgcolor: '#e3f2fd', p: 1 }}>
                            {item.sectionName}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.description || ''}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Item description..."
                          disabled={!canEdit}
                          sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity || 0}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          disabled={!canEdit}
                          sx={{ width: 80, '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                        <TextField
                          size="small"
                          value={item.unit || ''}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          disabled={!canEdit}
                          sx={{ width: 100, '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                          placeholder="m², m³, No."
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.rate || 0}
                          onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                          disabled={!canEdit}
                          sx={{ width: 120, '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #000', p: 1, bgcolor: '#fafafa' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.amount || 0}
                          InputProps={{ readOnly: true }}
                          sx={{ width: 120, bgcolor: '#fafafa', '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>
                        {canEdit && (
                          <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            <Card sx={{ p: 2, bgcolor: '#f9f9f9' }}>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography variant="body2">Sub-Total:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2" fontWeight="bold">{formatCurrency(totals.subtotal)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">Preliminaries ({totals.preliminaries}%):</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2">{formatCurrency(totals.preliminariesAmount)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">Contingency ({totals.contingency}%):</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2">{formatCurrency(totals.contingencyAmount)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">VAT ({totals.vat}%):</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2">{formatCurrency(totals.vatAmount)}</Typography></Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={6}><Typography variant="h6">GRAND TOTAL:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="h6" fontWeight="bold" color="primary">{formatCurrency(totals.grandTotal)}</Typography></Grid>
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
                value={form.preliminaries || 0}
                onChange={e => setForm({ ...form, preliminaries: e.target.value })}
                disabled={!canEdit}
              />
              <TextField
                label="Contingency (%)"
                type="number"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={form.contingency || 0}
                onChange={e => setForm({ ...form, contingency: e.target.value })}
                disabled={!canEdit}
              />
              <TextField
                label="VAT (%)"
                type="number"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={form.vat || 0}
                onChange={e => setForm({ ...form, vat: e.target.value })}
                disabled={!canEdit}
              />
              <TextField
                select
                label="Status"
                size="small"
                fullWidth
                value={form.status || 'draft'}
                onChange={e => setForm({ ...form, status: e.target.value })}
                disabled={!canEdit}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </TextField>
              {form.status === 'submitted' && <Chip label="Pending Approval" color="warning" size="small" sx={{ mt: 2 }} />}
              {form.status === 'approved' && <Chip label="Approved" color="success" size="small" sx={{ mt: 2 }} />}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Approval
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Prepared by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{creator?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Typography variant="body2">Approved by: _________________</Typography>
            <Typography variant="body2">Date: _________________</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save BOQ'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="outlined" onClick={() => navigate('/boq')}>
            Cancel
          </Button>
          {canEdit && id && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

export default BOQForm;
