import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const SitePlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    project: '',
    type: 'site_plan',
    description: '',
    dimensions: '',
    scale: '',
    status: 'draft',
    surveyPoints: [],
    boundaryData: { perimeter: '', area: '', coordinates: [] },
    foundationType: '',
    soilType: '',
    waterTableLevel: '',
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/projects');
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        if (id) {
          const planRes = await api.get(`/api/site-plans/${id}`);
          setForm(planRes.data);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (id) {
        await api.put(`/api/site-plans/${id}`, form);
        setMessage({ type: 'success', text: 'Plan updated!' });
      } else {
        await api.post('/api/site-plans', form);
        setMessage({ type: 'success', text: 'Plan created!' });
      }
      setTimeout(() => navigate('/site-plans'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Plan / Drawing' : 'New Plan / Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Plan Name *"
              name="name"
              fullWidth
              value={form.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Project"
              name="project"
              fullWidth
              value={form.project}
              onChange={handleChange}
            >
              <MenuItem value="">None</MenuItem>
              {projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Type"
              name="type"
              fullWidth
              value={form.type}
              onChange={handleChange}
            >
              <MenuItem value="site_plan">Site Plan</MenuItem>
              <MenuItem value="fence_drawing">Fence Drawing</MenuItem>
              <MenuItem value="access_plan">Access Plan</MenuItem>
              <MenuItem value="boundary_fence">Boundary Fence</MenuItem>
              <MenuItem value="survey_data">Survey Data</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Dimensions (e.g., 100m x 50m)"
              name="dimensions"
              fullWidth
              value={form.dimensions}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Scale (e.g., 1:100)"
              name="scale"
              fullWidth
              value={form.scale}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Status"
              name="status"
              fullWidth
              value={form.status}
              onChange={handleChange}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>

          {/* Survey-specific fields */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2 }}>Survey Data (optional)</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Foundation Type"
              name="foundationType"
              fullWidth
              value={form.foundationType}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Soil Type"
              name="soilType"
              fullWidth
              value={form.soilType}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Water Table Level (m)"
              name="waterTableLevel"
              type="number"
              fullWidth
              value={form.waterTableLevel}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Boundary Perimeter (m)"
              name="boundaryData.perimeter"
              type="number"
              fullWidth
              value={form.boundaryData?.perimeter || ''}
              onChange={(e) => setForm({
                ...form,
                boundaryData: { ...form.boundaryData, perimeter: e.target.value }
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Boundary Area (m²)"
              name="boundaryData.area"
              type="number"
              fullWidth
              value={form.boundaryData?.area || ''}
              onChange={(e) => setForm({
                ...form,
                boundaryData: { ...form.boundaryData, area: e.target.value }
              })}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Plan'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/site-plans')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SitePlanForm;
