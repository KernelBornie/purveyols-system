import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const VisitorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    idNumber: '',
    company: '',
    project: '',
    purpose: '',
    status: 'inside',
  });
  const [creator, setCreator] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [message, setMessage] = useState(null);

  const canEdit = ['admin', 'director', 'receptionist', 'security', 'civil-engineer', 'foreman'].includes(user?.role);
  const canCheckOut = ['admin', 'director', 'receptionist', 'security'].includes(user?.role);
  const canDelete = ['admin', 'director'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const projRes = await api.get('/api/projects');
        setProjects(projRes.data || []);
        if (id) {
          const res = await api.get(`/api/visitors/${id}`);
          const data = res.data;
          setForm({
            name: data.name || '',
            phone: data.phone || '',
            idNumber: data.idNumber || '',
            company: data.company || '',
            project: data.project?._id || data.project || '',
            purpose: data.purpose || '',
            status: data.status || 'inside',
          });
          setCreator(data.createdBy);
          setCheckIn(data.checkIn);
          setCheckOut(data.checkOut);
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
        name: form.name,
        phone: form.phone || '',
        idNumber: form.idNumber || '',
        company: form.company || '',
        project: form.project || null,
        purpose: form.purpose || '',
        status: form.status,
      };
      if (id) {
        await api.put(`/api/visitors/${id}`, payload);
        setMessage({ type: 'success', text: 'Visitor updated!' });
      } else {
        await api.post('/api/visitors', payload);
        setMessage({ type: 'success', text: 'Visitor checked in!' });
      }
      setTimeout(() => navigate('/visitors'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!id) return;
    try {
      await api.put(`/api/visitors/${id}/checkout`);
      setMessage({ type: 'success', text: 'Visitor checked out!' });
      const res = await api.get(`/api/visitors/${id}`);
      setForm(res.data);
      setCheckOut(res.data.checkOut);
      setTimeout(() => navigate('/visitors'), 1500);
    } catch (err) {
      alert('Check-out failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this visitor record?')) return;
    try {
      await api.delete(`/api/visitors/${id}`);
      navigate('/visitors');
    } catch (err) {
      alert('Delete failed');
    }
  };

  // ─── Custom print ────────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.name) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Record</title>
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
              <span class="left">VISITOR RECORD</span>
            </div>
            <div class="info">
              <p><strong>Name:</strong> ${form.name}</p>
              <p><strong>Phone:</strong> ${form.phone || '—'}</p>
              <p><strong>ID Number:</strong> ${form.idNumber || '—'}</p>
              <p><strong>Company:</strong> ${form.company || '—'}</p>
              <p><strong>Project:</strong> ${projects.find(p => p._id === form.project)?.name || 'N/A'}</p>
              <p><strong>Purpose:</strong> ${form.purpose || '—'}</p>
              <p><strong>Check-In:</strong> ${checkIn ? new Date(checkIn).toLocaleString() : '—'}</p>
              <p><strong>Check-Out:</strong> ${checkOut ? new Date(checkOut).toLocaleString() : '—'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              ${creator ? `<p><strong>Registered by:</strong> ${creator.name} (${creator.role})</p>` : ''}
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
    <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access.</Alert>}

      <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
        <img src="/top-log.PNG?t=3" alt="PURVEYOLS Logo" style={{ height: '60px', maxWidth: '100%' }} onError={(e) => e.target.style.display = 'none'} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>PURVEYOLS</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>Building and Civil contractors</Typography>
        <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
        <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
        <Typography variant="body2">Email: purveyols@gmail.com</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{id ? 'Edit Visitor' : 'New Visitor'}</Typography>
        {id && <Chip label={form.status} color={form.status === 'inside' ? 'success' : 'default'} size="small" />}
      </Box>

      {creator && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Registered by: <strong>{creator.name}</strong> ({creator.role})
        </Typography>
      )}
      {checkIn && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Check-In: <strong>{new Date(checkIn).toLocaleString()}</strong>
        </Typography>
      )}
      {checkOut && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Check-Out: <strong>{new Date(checkOut).toLocaleString()}</strong>
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Full Name *" fullWidth size="small" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={!canEdit || (id && form.status === 'departed')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Phone Number" fullWidth size="small" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={!canEdit || (id && form.status === 'departed')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="ID / Passport Number" fullWidth size="small" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} disabled={!canEdit || (id && form.status === 'departed')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Company" fullWidth size="small" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} disabled={!canEdit || (id && form.status === 'departed')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select label="Project" fullWidth size="small" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} disabled={!canEdit || (id && form.status === 'departed')}>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Purpose of Visit" fullWidth multiline rows={2} size="small" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} disabled={!canEdit || (id && form.status === 'departed')} placeholder="Reason for visit, person to see..." />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && form.status !== 'departed' && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Visitor'}
            </Button>
          )}
          {canCheckOut && id && form.status === 'inside' && (
            <Button variant="contained" color="secondary" startIcon={<LogoutIcon />} onClick={handleCheckOut}>
              Check Out
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/visitors')}>Cancel</Button>
          {canDelete && id && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

export default VisitorForm;