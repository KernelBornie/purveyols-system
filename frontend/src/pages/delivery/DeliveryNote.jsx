import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const DeliveryNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    ms: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ quantity: '', description: '' }],
    deliveredBy: '',
    receivedBy: '',
    noteNumber: '',
  });
  const [message, setMessage] = useState(null);

  const canEdit = ['procurement-officer', 'civil-engineer', 'quantity-surveyor', 'director', 'admin', 'driver', 'accountant', 'foreman'].includes(user?.role);

  const generateNoteNumber = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${y}${m}${d}-${rand}`;
  };

  useEffect(() => {
    if (id) {
      setFetching(true);
      api.get(`/api/delivery/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            ms: data.ms || '',
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            items: Array.isArray(data.items) ? data.items : [{ quantity: '', description: '' }],
            deliveredBy: data.deliveredBy || '',
            receivedBy: data.receivedBy || '',
            noteNumber: data.noteNumber || '',
          });
          setMessage(null);
        })
        .catch(() => setMessage({ type: 'error', text: 'Failed to load delivery note' }))
        .finally(() => setFetching(false));
    } else {
      setForm(prev => ({ ...prev, noteNumber: generateNoteNumber() }));
      setFetching(false);
    }
  }, [id]);

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { quantity: '', description: '' }] });
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) {
      setMessage({ type: 'warning', text: 'Must have at least one item.' });
      return;
    }
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        ms: form.ms,
        date: form.date,
        items: form.items.filter(item => item.description || item.quantity),
        deliveredBy: form.deliveredBy,
        receivedBy: form.receivedBy,
        noteNumber: form.noteNumber,
      };
      if (id) {
        await api.put(`/api/delivery/${id}`, payload);
        setMessage({ type: 'success', text: 'Delivery note updated!' });
      } else {
        await api.post('/api/delivery', payload);
        setMessage({ type: 'success', text: 'Delivery note created!' });
      }
      setTimeout(() => navigate('/delivery'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this delivery note permanently?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/delivery/${id}`);
      navigate('/delivery');
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || 'Unknown error'));
      setLoading(false);
    }
  };

  // ─── Custom print ────────────────────────────────────────────────
  const handlePrint = () => {
    const filledItems = form.items.filter(item => item.description || item.quantity);
    if (filledItems.length === 0) {
      alert('No items to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Note</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
            .print-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c; }
            .header .subtitle { font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c; }
            .header .details { font-size: 11px; margin: 1px 0; }
            .title-row { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; }
            .title-row .left { font-weight: bold; font-size: 18px; letter-spacing: 2px; color: #b71c1c; }
            .title-row .right { font-weight: bold; font-size: 14px; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; font-size: 11px; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .signatures { display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px solid #000; padding-top: 15px; }
            .signatures .sign-block { text-align: center; flex: 1; }
            .signatures .sign-block .line { border-top: 1px solid #000; width: 150px; margin: 20px auto 0; padding-top: 4px; font-size: 10px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>PURVEYOLS</h1>
              <div class="subtitle">Building and Civil contractors</div>
              <div class="details">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</div>
              <div class="details">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</div>
              <div class="details">Email: purveyols@gmail.com</div>
            </div>
            <div class="title-row">
              <span class="left">DELIVERY NOTE</span>
              <span class="right">No. ${form.noteNumber || 'N/A'}</span>
            </div>
            <div class="info">
              <p><strong>M/S:</strong> ${form.ms || '—'}</p>
              <p><strong>Date:</strong> ${form.date || '—'}</p>
            </div>
            <table>
              <thead><tr><th>Qty</th><th>Description</th></tr></thead>
              <tbody>
                ${filledItems.map(item => `
                  <tr><td>${item.quantity || '—'}</td><td>${item.description || '—'}</td></tr>
                `).join('')}
              </tbody>
            </table>
            <div class="signatures">
              <div class="sign-block"><strong>Delivered By</strong><div class="line">${form.deliveredBy || '_________________'}</div></div>
              <div class="sign-block"><strong>Received By</strong><div class="line">${form.receivedBy || '_________________'}</div></div>
            </div>
            <div class="footer">PURVEYOLS CMS - Construction Management System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (fetching) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access.</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img src="/top-log.PNG?t=3" alt="PURVEYOLS Logo" style={{ height: '60px', maxWidth: '100%' }} onError={(e) => e.target.style.display = 'none'} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>Building and Civil contractors</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>DELIVERY NOTE</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>No.: {form.noteNumber || 'NEW'}</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="M/S" fullWidth size="small" value={form.ms} onChange={e => setForm({ ...form, ms: e.target.value })} placeholder="Customer name..." disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Date" type="date" fullWidth size="small" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} disabled={!canEdit} />
          </Grid>
        </Grid>

        <Table size="small" sx={{ border: '1px solid #000' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', width: '30%' }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', width: '60px' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {form.items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                  <TextField size="small" fullWidth value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} placeholder="e.g., 5" disabled={!canEdit} sx={{ '& .MuiInputBase-root': { border: 'none' } }} />
                </TableCell>
                <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                  <TextField size="small" fullWidth value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item description..." disabled={!canEdit} sx={{ '& .MuiInputBase-root': { border: 'none' } }} />
                </TableCell>
                <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>
                  <IconButton size="small" onClick={() => removeItem(idx)} color="error" disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {canEdit && (
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem} size="small">Add Row</Button>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Delivered By" fullWidth size="small" value={form.deliveredBy} onChange={e => setForm({ ...form, deliveredBy: e.target.value })} placeholder="Name of deliverer..." disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Received By" fullWidth size="small" value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} placeholder="Name of receiver..." disabled={!canEdit} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>{loading ? 'Saving...' : 'Save Delivery Note'}</Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/delivery')}>Cancel</Button>
          {canEdit && id && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={loading}>Delete</Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

export default DeliveryNote;