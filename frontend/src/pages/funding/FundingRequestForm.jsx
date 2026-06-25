import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button,
  MenuItem, Alert, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const FundingRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    amount: '',
    description: '',
    recipientPhone: '',
    status: 'pending',
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [approver, setApprover] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);
  const [message, setMessage] = useState(null);

  const canEdit = ['admin', 'director', 'accountant', 'civil-engineer', 'quantity-surveyor', 'procurement-officer'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        if (id) {
          const fundingRes = await api.get(`/api/funding-requests/${id}`);
          const data = fundingRes.data;
          setForm({
            project: data.project?._id || data.project || '',
            amount: data.amount || '',
            description: data.description || '',
            recipientPhone: data.recipientPhone || '',
            status: data.status || 'pending',
          });
          setCreator(data.requestedBy);
          setCreatedAt(data.requestedAt || data.createdAt);
          setApprover(data.approvedBy);
          setApprovedAt(data.approvedAt);
        } else {
          setCreator(user);
          setCreatedAt(new Date().toISOString());
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ type: 'error', text: 'Failed to load data' });
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
        amount: parseFloat(form.amount) || 0,
        description: form.description,
        recipientPhone: form.recipientPhone,
        status: form.status,
      };
      if (id) {
        await api.put(`/api/funding-requests/${id}`, payload);
        setMessage({ type: 'success', text: 'Funding request updated successfully!' });
      } else {
        await api.post('/api/funding-requests', payload);
        setMessage({ type: 'success', text: 'Funding request submitted successfully!' });
      }
      setTimeout(() => navigate('/funding'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save request' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Custom print ────────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.project && !form.amount && !form.description) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Funding Request</title>
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
            .approval .row { display: flex; justify-content: space-between; }
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
              <span class="left">REQUEST DIRECT FUNDING</span>
            </div>
            <div class="info">
              <p><strong>Project:</strong> ${projects.find(p => p._id === form.project)?.name || 'N/A'}</p>
              <p><strong>Amount:</strong> K ${parseFloat(form.amount).toFixed(2)}</p>
              <p><strong>Description:</strong> ${form.description || '—'}</p>
              <p><strong>Recipient Phone:</strong> ${form.recipientPhone || '—'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              ${creator ? `<p><strong>Requested by:</strong> ${creator.name} (${creator.role})</p>` : ''}
              ${createdAt ? `<p><strong>Requested on:</strong> ${new Date(createdAt).toLocaleString()}</p>` : ''}
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Paper sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>REQUEST DIRECT FUNDING</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{id ? 'Edit Request' : 'New Request'}</Typography>
        </Box>

        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">Requested by: <strong>{creator.name}</strong> ({creator.role})</Typography>
            <Typography variant="body2" color="textSecondary">Requested on: {formatDate(createdAt)}</Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField select label="Project *" fullWidth size="small" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} required disabled={!canEdit}>
              {Array.isArray(projects) && projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Amount (ZMW) *" type="number" fullWidth size="small" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required inputProps={{ min: 0, step: 0.01 }} disabled={!canEdit} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Recipient Phone (Airtel Money)" fullWidth size="small" value={form.recipientPhone || ''} onChange={e => setForm({ ...form, recipientPhone: e.target.value })} placeholder="e.g., 0971234567" disabled={!canEdit} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField select label="Status" fullWidth size="small" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })} disabled={!canEdit}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              {form.status === 'draft' && <Chip label="Draft" color="default" size="small" />}
              {form.status === 'pending' && <Chip label="Pending" color="warning" size="small" />}
              {form.status === 'approved' && <Chip label="Approved" color="success" size="small" />}
              {form.status === 'rejected' && <Chip label="Rejected" color="error" size="small" />}
              {form.status === 'funded' && <Chip label="Funded" color="info" size="small" />}
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={4} size="small" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide details about the funding request..." disabled={!canEdit} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Requested by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{creator?.name || 'N/A'}</Typography>
              {creator && <Typography variant="caption" color="textSecondary">{creator.role} • {formatDate(createdAt)}</Typography>}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formatDate(createdAt)}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {approver ? (
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

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Request'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/funding')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default FundingRequestForm;