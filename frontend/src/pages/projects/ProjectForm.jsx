import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem, Alert, Chip, Slider, Avatar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
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
    image: '',
    progress: 0,
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [approver, setApprover] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
            image: data.image || '',
            progress: data.progress || 0,
          });
          if (data.image) setImagePreview(data.image);
          setCreator(data.createdBy);
          setCreatedAt(data.createdAt);
          setApprover(data.approvedBy);
          setApprovedAt(data.approvedAt);
        })
        .catch(err => {
          console.error('Error fetching project:', err);
          setMessage({ type: 'error', text: 'Failed to load project' });
        });
    } else {
      setCreator(user);
      setCreatedAt(new Date().toISOString());
    }
  }, [id, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setForm({ ...form, image: compressedBase64 });
        setImagePreview(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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
        image: form.image,
        progress: Number(form.progress) || 0,
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
      const msg = err.response?.data?.error || 'Failed to save project';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();
  const formatDate = (date) => date ? new Date(date).toLocaleString() : '—';

  return (
    <Paper sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          pb: 2,
          mb: 2,
          '@media print': { borderBottom: '2px solid #000' }
        }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Building and Civil Construction</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

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
            {id ? `Project ID: ${id.slice(-6)}` : 'New Project'}
          </Typography>
        </Box>

        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by: <strong>{creator.name}</strong> ({creator.role})
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created on: {formatDate(createdAt)}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Project Photo</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={imagePreview || '/project-placeholder.jpg'} sx={{ width: 100, height: 100, borderRadius: 2, border: '1px solid #ccc' }} variant="rounded" />
            <Button variant="outlined" component="label" startIcon={<PhotoCameraIcon />}>
              Upload Image
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Button>
            {imagePreview && (
              <Button variant="outlined" color="error" onClick={() => { setForm({ ...form, image: '' }); setImagePreview(null); }}>Remove</Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField label="Project Name *" fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Enter project name..." />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Location" fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, Area, Site..." />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Budget (ZMW)" type="number" fullWidth size="small" value={form.budget || ''} onChange={e => setForm({ ...form, budget: e.target.value })} inputProps={{ min: 0, step: 0.01 }} placeholder="0.00" />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField select label="Status" fullWidth size="small" value={form.status || 'planning'} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography gutterBottom>Progress: {form.progress}%</Typography>
            <Slider value={form.progress} onChange={(e, val) => setForm({ ...form, progress: val })} min={0} max={100} step={1} valueLabelDisplay="auto" />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={4} size="small" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide details about the project..." />
          </Grid>
        </Grid>

        {/* Approval Section */}
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
            {approver && form.status === 'active' ? (
              <>
                <Typography variant="body2">
                  Approved by: <strong>{approver.name}</strong> ({approver.role})
                </Typography>
                <Typography variant="body2">
                  Approved on: <strong>{formatDate(approvedAt)}</strong>
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2">Approved by: _________________</Typography>
                <Typography variant="body2">Date: _________________</Typography>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Chip label={form.status} color={form.status === 'active' ? 'success' : 'default'} size="small" />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Project'}
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/projects')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ProjectForm;