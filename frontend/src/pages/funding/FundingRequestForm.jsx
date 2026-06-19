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
    status: 'pending',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const fundingRes = await api.get(`/api/funding/${id}`);
          const data = fundingRes.data;
          setForm({
            project: data.project || '',
            amount: data.amount || '',
            description: data.description || '',
            status: data.status || 'pending',
          });
          setCreator(data.requestedBy);
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
        amount: parseFloat(form.amount) || 0,
        description: form.description,
        status: form.status,
      };

      if (id) {
        await api.put(`/api/funding/${id}`, payload);
        setMessage({ type: 'success', text: 'Funding request updated successfully!' });
      } else {
        await api.post('/api/funding', payload);
        setMessage({ type: 'success', text: 'Funding request submitted successfully!' });
      }
      setTimeout(() => navigate('/funding'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save request' });
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
            REQUEST DIRECT FUNDING
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? 'Edit Request' : 'New Request'}
          </Typography>
        </Box>

        {/* Creator Info */}
        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Requested by (you): <strong>{creator.name}</strong> ({creator.role})
            </Typography>
          </Box>
        )}

        {/* Project Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
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
        </Grid>

        {/* Amount and Description */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Amount (ZMW) *"
              type="number"
              fullWidth
              size="small"
              value={form.amount || ''}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Status"
              select
              fullWidth
              size="small"
              value={form.status || 'pending'}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Description */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              size="small"
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide details about the funding request..."
            />
          </Grid>
        </Grid>

        {/* Approval Section (Optional - simple preview) */}
        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Approval
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Requested by:</Typography>
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

        {/* Status chip */}
        <Box sx={{ mt: 3 }}>
          {form.status === 'pending' && <Chip label="Pending" color="warning" size="small" />}
          {form.status === 'approved' && <Chip label="Approved" color="success" size="small" />}
          {form.status === 'rejected' && <Chip label="Rejected" color="error" size="small" />}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Request'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/funding')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default FundingRequestForm;
