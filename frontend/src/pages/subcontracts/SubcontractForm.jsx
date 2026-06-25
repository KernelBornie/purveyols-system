import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button,
  MenuItem, Alert, Chip, CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const SubcontractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    vendor: '',
    vendorPhone: '',
    service: '',
    amount: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    description: '',
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [approver, setApprover] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);
  const [message, setMessage] = useState(null);

  const canEdit = ['procurement-officer', 'civil-engineer', 'quantity-surveyor', 'director', 'admin', 'accountant', 'foreman'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        if (id) {
          const subRes = await api.get(`/api/subcontracts/${id}`);
          const data = subRes.data;
          setForm({
            project: data.project?._id || data.project || '',
            vendor: data.vendor || '',
            vendorPhone: data.vendorPhone || '',
            service: data.service || '',
            amount: data.amount || '',
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            status: data.status || 'draft',
            description: data.description || '',
          });
          setCreator(data.createdBy);
          setCreatedAt(data.createdAt);
          setApprover(data.approvedBy);
          setApprovedAt(data.approvedAt);
        } else {
          setCreator(user);
          setCreatedAt(new Date().toISOString());
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
        project: form.project,
        vendor: form.vendor,
        vendorPhone: form.vendorPhone,
        service: form.service,
        amount: parseFloat(form.amount) || 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        status: form.status,
        description: form.description || '',
      };
      if (id) {
        await api.put(`/api/subcontracts/${id}`, payload);
        setMessage({ type: 'success', text: 'Subcontract updated successfully!' });
      } else {
        await api.post('/api/subcontracts', payload);
        setMessage({ type: 'success', text: 'Subcontract created successfully!' });
      }
      setTimeout(() => navigate('/subcontracts'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save subcontract' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this subcontract?')) return;
    try {
      await api.delete(`/api/subcontracts/${id}`);
      navigate('/subcontracts');
    } catch (err) {
      alert('Delete failed');
    }
  };

  // ─── Custom print ────────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.vendor && !form.service) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Subcontract</title>
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
              <span class="left">SUBCONTRACT</span>
            </div>
            <div class="info">
              <p><strong>Project:</strong> ${projects.find(p => p._id === form.project)?.name || 'N/A'}</p>
              <p><strong>Vendor:</strong> ${form.vendor || '—'}</p>
              <p><strong>Vendor Phone:</strong> ${form.vendorPhone || '—'}</p>
              <p><strong>Service:</strong> ${form.service || '—'}</p>
              <p><strong>Amount:</strong> K ${parseFloat(form.amount).toFixed(2)}</p>
              <p><strong>Start Date:</strong> ${form.startDate || '—'}</p>
              <p><strong>End Date:</strong> ${form.endDate || '—'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              <p><strong>Description:</strong> ${form.description || '—'}</p>
              ${creator ? `<p><strong>Created by:</strong> ${creator.name} (${creator.role})</p>` : ''}
              ${createdAt ? `<p><strong>Created on:</strong> ${new Date(createdAt).toLocaleString()}</p>` : ''}
            </div>
            <div class="approval">
              <div class="row">
                <div><strong>Approved by:</strong> ${approver ? `${approver.name} (${approver.role})` : '_________________'}</div>
                <div><strong>Date:</strong> ${approvedAt ? new Date(approvedAt).toLocaleString() : '_________________'}</div>
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

  const formatDate = (date) => date ? new Date(date).toLocaleString() : '—';

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>{id ? 'EDIT SUBCONTRACT' : 'NEW SUBCONTRACT'}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{id ? `Contract ID: ${id.slice(-6)}` : 'New'}</Typography>
        </Box>

        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">Created by: <strong>{creator.name}</strong> ({creator.role})</Typography>
            <Typography variant="body2" color="textSecondary">Created on: {formatDate(createdAt)}</Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField select label="Project *" fullWidth size="small" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} required disabled={!canEdit}>
              {Array.isArray(projects) && projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Vendor *" fullWidth size="small" value={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })} required placeholder="Company or individual name" disabled={!canEdit} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Vendor Phone" fullWidth size="small" value={form.vendorPhone || ''} onChange={e => setForm({ ...form, vendorPhone: e.target.value })} placeholder="e.g., 0971234567" disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Service *" fullWidth size="small" value={form.service || ''} onChange={e => setForm({ ...form, service: e.target.value })} required placeholder="e.g., Electrical, Plumbing" disabled={!canEdit} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Amount (ZMW)" type="number" fullWidth size="small" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} inputProps={{ min: 0, step: 0.01 }} placeholder="0.00" disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Status" select fullWidth size="small" value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value })} disabled={!canEdit}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Start Date" type="date" fullWidth size="small" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="End Date" type="date" fullWidth size="small" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={!canEdit} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={3} size="small" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional details about the subcontract..." disabled={!canEdit} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Prepared by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{creator?.name || 'N/A'}</Typography>
              <Typography variant="caption" color="textSecondary">{creator?.role || ''} • {formatDate(createdAt)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formatDate(createdAt)}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {approver && form.status === 'approved' ? (
              <>
                <Typography variant="body2">Approved by: <strong>{approver.name}</strong> ({approver.role})</Typography>
                <Typography variant="body2">Approved on: <strong>{formatDate(approvedAt)}</strong></Typography>
              </>
            ) : (
              <>
                <Typography variant="body2">Approved by: _________________</Typography>
                <Typography variant="body2">Date: _________________</Typography>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>{loading ? 'Saving...' : 'Save Subcontract'}</Button>}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/subcontracts')}>Cancel</Button>
          {canEdit && id && <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={loading}>Delete</Button>}
        </Box>
      </form>
    </Paper>
  );
};

export default SubcontractForm;