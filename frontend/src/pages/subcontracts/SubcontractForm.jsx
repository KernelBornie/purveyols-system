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

const SubcontractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    vendor: '',
    service: '',
    amount: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    description: '',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const subRes = await api.get(`/api/subcontracts/${id}`);
          const data = subRes.data;
          setForm({
            project: data.project || '',
            vendor: data.vendor || '',
            service: data.service || '',
            amount: data.amount || '',
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            status: data.status || 'draft',
            description: data.description || '',
          });
          setCreator(data.createdBy);
        } else {
          setCreator(user);
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
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        project: form.project,
        vendor: form.vendor,
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

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <BackButton />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

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
            {id ? 'EDIT SUBCONTRACT' : 'NEW SUBCONTRACT'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `Contract ID: ${id}` : 'New'}
          </Typography>
        </Box>

        {/* Creator Info */}
        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by (you): <strong>{creator.name}</strong> ({creator.role})
            </Typography>
          </Box>
        )}

        {/* Project and Vendor */}
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
            >
              {Array.isArray(projects) && projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Vendor *"
              fullWidth
              size="small"
              value={form.vendor || ''}
              onChange={e => setForm({ ...form, vendor: e.target.value })}
              required
              placeholder="Company or individual name"
            />
          </Grid>
        </Grid>

        {/* Service and Amount */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Service *"
              fullWidth
              size="small"
              value={form.service || ''}
              onChange={e => setForm({ ...form, service: e.target.value })}
              required
              placeholder="e.g., Electrical, Plumbing"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Amount (ZMW)"
              type="number"
              fullWidth
              size="small"
              value={form.amount || ''}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
            />
          </Grid>
        </Grid>

        {/* Start and End Dates */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              size="small"
              value={form.startDate || ''}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              size="small"
              value={form.endDate || ''}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Status and Description */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={form.status || 'draft'}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              {form.status === 'draft' && <Chip label="Draft" color="info" size="small" />}
              {form.status === 'active' && <Chip label="Active" color="success" size="small" />}
              {form.status === 'completed' && <Chip label="Completed" color="default" size="small" />}
              {form.status === 'terminated' && <Chip label="Terminated" color="error" size="small" />}
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details about the subcontract..."
            />
          </Grid>
        </Grid>

        {/* Approval Section */}
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

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Subcontract'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/subcontracts')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SubcontractForm;
