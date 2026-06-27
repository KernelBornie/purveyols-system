import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, FormControl,
  InputLabel, Select, Alert, CircularProgress, Grid, Chip, IconButton,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BackButton from '../../components/BackButton';
import api from '../../api/axios';

const SafetyReportForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  const [images, setImages] = useState([]); // array of { name, dataURL }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/api/safety-reports/${id}`)
        .then(res => {
          const data = res.data;
          setFormData({
            title: data.title || '',
            description: data.description || '',
            location: data.location || '',
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
            status: data.status || 'pending',
          });
          if (data.images && data.images.length) {
            setImages(data.images.map(img => ({ name: img.name, dataURL: img.dataURL })));
          }
        })
        .catch(err => setError('Failed to load report'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Image handlers ──────────────────────────────────────────
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalid = files.find(f => !validTypes.includes(f.type));
    if (invalid) {
      setSnackbar({ open: true, message: 'Only JPEG, PNG, GIF, and WEBP allowed.', severity: 'error' });
      return;
    }

    // Read each file as dataURL
    const newImages = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          name: file.name,
          dataURL: event.target.result,
        });
        if (newImages.length === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        images: images, // array of { name, dataURL }
      };
      if (isEdit) {
        await api.put(`/api/safety-reports/${id}`, payload);
      } else {
        await api.post('/api/safety-reports', payload);
      }
      navigate('/safety-reports');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  // ─── Custom print ────────────────────────────────────────────
  const handlePrint = () => {
    if (!formData.title) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    // Build images HTML
    let imagesHtml = '';
    if (images.length > 0) {
      imagesHtml = '<div style="margin-top:10px;"><strong>Attached Evidence:</strong><br/>';
      images.forEach(img => {
        imagesHtml += `<img src="${img.dataURL}" style="max-width:200px; max-height:200px; margin:5px; border:1px solid #ccc; padding:2px;" />`;
      });
      imagesHtml += '</div>';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Safety Report</title>
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
            .images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
            .images img { max-width: 200px; max-height: 200px; border: 1px solid #ccc; padding: 2px; }
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
              <span class="left">SAFETY REPORT</span>
            </div>
            <div class="info">
              <p><strong>Title:</strong> ${formData.title}</p>
              <p><strong>Location:</strong> ${formData.location || '—'}</p>
              <p><strong>Date:</strong> ${formData.date || '—'}</p>
              <p><strong>Status:</strong> ${formData.status}</p>
              <p><strong>Description:</strong> ${formData.description || '—'}</p>
            </div>
            ${imagesHtml}
            <div class="footer">PURVEYOLS CMS - Construction Management System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <BackButton />
      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img src="/top-log.PNG?t=3" alt="PURVEYOLS Logo" style={{ height: '60px', maxWidth: '100%' }} onError={(e) => e.target.style.display = 'none'} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>Building and Civil contractors</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        <Typography variant="h5" gutterBottom>
          {isEdit ? 'Edit Safety Report' : 'New Safety Report'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location / Site"
                name="location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description / Findings"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="passed">Passed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* ─── Photo Upload ────────────────────────────────────── */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>
                Attach Evidence (Photos)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {images.map((img, idx) => (
                  <Box key={idx} sx={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={img.dataURL}
                      alt={img.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'white',
                        boxShadow: 1,
                        '&:hover': { bgcolor: '#f44336', color: 'white' }
                      }}
                      onClick={() => removeImage(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 1 }}
              >
                Upload Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </Button>
              <Typography variant="caption" display="block" color="textSecondary">
                Supported: JPEG, PNG, GIF, WEBP
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
            <Button onClick={() => navigate('/safety-reports')} disabled={saving}>
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SafetyReportForm;