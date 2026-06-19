import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem, Alert, Chip, Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    budget: '',
    status: 'planning',
    description: '',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (id) {
      api.get(`/api/projects/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            name: data.name || '',
            location: data.location || '',
            budget: data.budget || '',
            status: data.status || 'planning',
            description: data.description || '',
          });
          setCreator(data.createdBy);
        })
        .catch(err => {
          console.error('Error fetching project:', err);
          setMessage({ type: 'error', text: 'Failed to load project' });
        });
    } else {
      setCreator(user);
    }
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        location: form.location || '',
        budget: parseFloat(form.budget) || 0,
        status: form.status,
        description: form.description || '',
      };

      if (id) {
        await api.put(`/api/projects/${id}`, payload);
        setMessage({ type: 'success', text: 'Project updated successfully!' });
      } else {
        await api.post('/api/projects', payload);
        setMessage({ type: 'success', text: 'Project created successfully!' });
      }
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save project' });
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
            {id ? 'EDIT PROJECT' : 'CREATE PROJECT'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `Project ID: ${id}` : 'New Project'}
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

        {/* Form Fields */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              label="Project Name *"
              fullWidth
              size="small"
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Enter project name..."
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Location"
              fullWidth
              size="small"
              value={form.location || ''}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="City, Area, Site..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Budget (ZMW)"
              type="number"
              fullWidth
              size="small"
              value={form.budget || ''}
              onChange={e => setForm({ ...form, budget: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={form.status || 'planning'}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              {form.status === 'planning' && <Chip label="Planning" color="info" size="small" />}
              {form.status === 'active' && <Chip label="Active" color="success" size="small" />}
              {form.status === 'paused' && <Chip label="Paused" color="warning" size="small" />}
              {form.status === 'completed' && <Chip label="Completed" color="default" size="small" />}
            </Box>
          </Grid>
        </Grid>

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
              placeholder="Provide details about the project..."
            />
          </Grid>
        </Grid>

        {/* Approval / Signature Section */}
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
            {loading ? 'Saving...' : 'Save Project'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/projects')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ProjectForm;
