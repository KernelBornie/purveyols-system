import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const SparePartForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    item: '',
    quantity: 1,
    description: '',
    status: 'pending',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  const canEdit = ['driver', 'procurement-officer', 'director', 'admin'].includes(user?.role);
  const isDriver = user?.role === 'driver';

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const projRes = await api.get('/api/projects');
        setProjects(projRes.data || []);
        if (id) {
          const res = await api.get(`/api/spare-parts/${id}`);
          const data = res.data;
          setForm({
            project: data.project?._id || data.project || '',
            item: data.item || '',
            quantity: data.quantity || 1,
            description: data.description || '',
            status: data.status || 'pending',
          });
          setCreator(data.driver);
        } else {
          setCreator(user);
        }
        setMessage(null);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        project: form.project || null,
        item: form.item,
        quantity: Number(form.quantity),
        description: form.description,
        status: form.status,
      };
      if (id) {
        await api.put(`/api/spare-parts/${id}`, payload);
        setMessage({ type: 'success', text: 'Request updated!' });
      } else {
        await api.post('/api/spare-parts', payload);
        setMessage({ type: 'success', text: 'Request created!' });
      }
      setTimeout(() => navigate('/spare-parts'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/api/spare-parts/${id}`);
      navigate('/spare-parts');
    } catch (err) {
      alert('Delete failed');
    }
  };

  // ─── Custom print ────────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.item) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Spare Parts Request</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
            .print-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c; }
            .header .subtitle { font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c; }
            .header .details { font-size: 11px; margin: 1px 0; }
            .title-row { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; }
            .title-row .left { font-weight: bold; font-size: 18px; letter-spacing: 2px; color: #b71c1c; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; font-size: 12px; }
            .approval { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; }
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
              <span class="left">SPARE PARTS REQUEST</span>
            </div>
            <div class="info">
              <p><strong>Item:</strong> ${form.item}</p>
              <p><strong>Quantity:</strong> ${form.quantity}</p>
              <p><strong>Project:</strong> ${projects.find(p => p._id === form.project)?.name || 'N/A'}</p>
              <p><strong>Description:</strong> ${form.description || '—'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              ${creator ? `<p><strong>Requested by:</strong> ${creator.name} (${creator.role})</p>` : ''}
            </div>
            <div class="approval">
              <div class="row">
                <div><strong>Approved by:</strong> _________________</div>
                <div><strong>Date:</strong> _________________</div>
              </div>
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
    <Paper sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
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
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{id ? 'Edit Spare Parts Request' : 'New Spare Parts Request'}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{id ? `#${id.slice(-6)}` : 'New'}</Typography>
        </Box>

        {creator && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Requested by (you): <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Item *" fullWidth size="small" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required disabled={!canEdit || (id && form.status !== 'pending' && !isDriver)} placeholder="e.g., Oil filter, brake pads" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Quantity *" type="number" fullWidth size="small" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} inputProps={{ min: 1 }} required disabled={!canEdit || (id && form.status !== 'pending' && !isDriver)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select label="Project (optional)" fullWidth size="small" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} disabled={!canEdit || (id && form.status !== 'pending' && !isDriver)}>
              <MenuItem value="">None</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={3} size="small" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Reason for request, additional details..." disabled={!canEdit || (id && form.status !== 'pending' && !isDriver)} />
          </Grid>
          {!isDriver && (user?.role === 'procurement-officer' || user?.role === 'director' || user?.role === 'admin') && (
            <Grid item xs={12}>
              <TextField select label="Status" fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
          )}
          {isDriver && (
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">Status: {form.status}</Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="body2">Requested by: <strong>{creator?.name || 'N/A'}</strong></Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">Approved by: _________________</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">Date: _________________</Typography></Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Request'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/spare-parts')}>Cancel</Button>
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

export default SparePartForm;