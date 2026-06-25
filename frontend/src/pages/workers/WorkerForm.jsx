import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import CheckInIcon from '@mui/icons-material/AssignmentTurnedIn';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    nrc: '',
    phone: '',
    dailyRate: '',
    site: '',
    status: 'active',
    project: '',
  });
  const [enroller, setEnroller] = useState(null);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    date: new Date().toISOString().split('T')[0],
    days: 1,
    rate: 0,
    site: '',
    notes: '',
  });

  const canEdit = ['admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'].includes(user?.role);
  const canCheckIn = canEdit;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const workerRes = await api.get(`/api/workers/${id}`);
          const data = workerRes.data;
          setForm({
            name: data.name || '',
            nrc: data.nrc || '',
            phone: data.phone || '',
            dailyRate: data.dailyRate || '',
            site: data.site || '',
            status: data.status || 'active',
            project: data.project?._id || data.project || '',
          });
          setEnroller(data.enrolledBy);
          setBalance(data.balance || 0);
        } else {
          if (!canEdit) {
            navigate('/workers');
            return;
          }
          setEnroller(user);
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id, user, canEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        nrc: form.nrc,
        phone: form.phone || '',
        dailyRate: parseFloat(form.dailyRate) || 0,
        site: form.site || '',
        status: form.status,
        project: form.project || null,
      };
      if (id) {
        await api.put(`/api/workers/${id}`, payload);
        setMessage({ type: 'success', text: 'Worker updated successfully!' });
      } else {
        await api.post('/api/workers', payload);
        setMessage({ type: 'success', text: 'Worker enrolled successfully!' });
      }
      setTimeout(() => navigate('/workers'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save worker' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOpen = () => {
    if (!id) {
      setMessage({ type: 'error', text: 'Please save the worker first before checking in.' });
      return;
    }
    setCheckInForm({
      date: new Date().toISOString().split('T')[0],
      days: 1,
      rate: form.dailyRate || 0,
      site: form.site || '',
      notes: '',
    });
    setCheckInOpen(true);
  };

  const handleCheckInSubmit = async () => {
    if (!id) return;
    if (!checkInForm.date || checkInForm.days <= 0 || checkInForm.rate < 0) {
      setMessage({ type: 'error', text: 'Please fill all fields correctly.' });
      return;
    }
    try {
      await api.post('/api/attendance', {
        workerId: id,
        date: checkInForm.date,
        days: checkInForm.days,
        rate: checkInForm.rate,
        site: checkInForm.site,
        notes: checkInForm.notes,
      });
      setCheckInOpen(false);
      setMessage({ type: 'success', text: `Checked in for ${checkInForm.days} day(s)` });
      const updated = await api.get(`/api/workers/${id}`);
      setBalance(updated.data.balance || 0);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Check‑in failed' });
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
          <title>Worker</title>
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
              <span class="left">WORKER ENROLMENT</span>
            </div>
            <div class="info">
              <p><strong>Name:</strong> ${form.name}</p>
              <p><strong>NRC:</strong> ${form.nrc}</p>
              <p><strong>Phone:</strong> ${form.phone || '—'}</p>
              <p><strong>Daily Rate:</strong> K ${parseFloat(form.dailyRate).toFixed(2)}</p>
              <p><strong>Site:</strong> ${form.site || '—'}</p>
              <p><strong>Project:</strong> ${projects.find(p => p._id === form.project)?.name || 'N/A'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              <p><strong>Pending Balance:</strong> K ${balance.toFixed(2)}</p>
              ${enroller ? `<p><strong>Enrolled by:</strong> ${enroller.name} (${enroller.role})</p>` : ''}
            </div>
            <div class="approval">
              <div class="row">
                <div><strong>Verified by:</strong> _________________</div>
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

  return (
    <Paper sx={{ p: 3, maxWidth: '700px', mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access. Edits are disabled.</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img src="/top-log.PNG?t=3" alt="PURVEYOLS Logo" style={{ height: '60px', maxWidth: '100%' }} onError={(e) => e.target.style.display = 'none'} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>Building and Civil contractors</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {id ? 'EDIT WORKER' : 'ENROLL WORKER'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `Worker ID: ${id}` : 'New Worker'}
          </Typography>
        </Box>

        {enroller && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enrolled by (you): <strong>{enroller.name}</strong> ({enroller.role})
          </Typography>
        )}

        {id && (
          <Box sx={{ mb: 2 }}>
            <Chip label={`Pending: K ${balance}`} color={balance > 0 ? 'warning' : 'success'} size="medium" />
            {canCheckIn && (
              <Button variant="outlined" startIcon={<CheckInIcon />} onClick={handleCheckInOpen} sx={{ ml: 2 }} size="small">
                Check In
              </Button>
            )}
          </Box>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Full Name *" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="NRC Number *" fullWidth value={form.nrc} onChange={e => setForm({ ...form, nrc: e.target.value })} required disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Phone Number" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Daily Rate (ZMW)" type="number" fullWidth value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} inputProps={{ min: 0, step: 0.01 }} disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Site / Location" fullWidth value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} disabled={!canEdit} />
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Project *" fullWidth value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} disabled={!canEdit} required>
              <MenuItem value="">Select a project</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Status" fullWidth value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={!canEdit}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Enrolled by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{enroller?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Typography variant="body2">Verified by: _________________</Typography>
            <Typography variant="body2">Date: _________________</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Worker'}
            </Button>
          )}
          {id && canCheckIn && (
            <Button variant="outlined" startIcon={<CheckInIcon />} onClick={handleCheckInOpen}>
              Check In
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/workers')}>Cancel</Button>
        </Box>
      </form>

      <Dialog open={checkInOpen} onClose={() => setCheckInOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check In Worker</DialogTitle>
        <DialogContent>
          <TextField label="Date" type="date" fullWidth margin="dense" value={checkInForm.date} onChange={e => setCheckInForm({ ...checkInForm, date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Days Worked" type="number" fullWidth margin="dense" value={checkInForm.days} onChange={e => setCheckInForm({ ...checkInForm, days: Math.max(1, Number(e.target.value)) })} inputProps={{ min: 1 }} />
          <TextField label="Rate (ZMW per day)" type="number" fullWidth margin="dense" value={checkInForm.rate} onChange={e => setCheckInForm({ ...checkInForm, rate: Math.max(0, Number(e.target.value)) })} inputProps={{ min: 0, step: 0.01 }} />
          <TextField label="Site" fullWidth margin="dense" value={checkInForm.site} onChange={e => setCheckInForm({ ...checkInForm, site: e.target.value })} />
          <TextField label="Notes" fullWidth margin="dense" value={checkInForm.notes} onChange={e => setCheckInForm({ ...checkInForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCheckInSubmit}>Confirm Check‑in</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkerForm;