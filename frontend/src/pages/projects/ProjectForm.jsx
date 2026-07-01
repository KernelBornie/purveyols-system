import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem, Alert, Chip, Slider, Avatar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, Backdrop
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProjectForm = () => {
  const { id } = useParams();
  const location = useLocation();
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
    documents: [],
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [approver, setApprover] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [docExpanded, setDocExpanded] = useState(true);
  const [docEditDialog, setDocEditDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docForm, setDocForm] = useState({ name: '', description: '' });

  const isView = location.pathname.includes('/view');
  const isEdit = location.pathname.includes('/edit') || (id && !isView);
  const isNew = !id;

  const canEdit = !isView && !['driver', 'receptionist', 'safety-officer'].includes(user?.role);
  const canDelete = !isView && ['admin', 'director', 'accountant'].includes(user?.role);
  const isReadOnly = isView || !canEdit;

  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  // ─── Helper: get file URL ──────────────────────────────────────────
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (api.defaults.baseURL) return `${api.defaults.baseURL}${path}`;
    if (process.env.REACT_APP_API_URL) return `${process.env.REACT_APP_API_URL}${path}`;
    return `${window.location.origin}${path}`;
  };

  // ─── Document handlers ─────────────────────────────────────────────
  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!id) {
      setMessage({ type: 'warning', text: 'Please save the project first before uploading documents.' });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      const res = await api.post(`/api/projects/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({
        ...prev,
        documents: [...prev.documents, res.data.document],
      }));
      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    }
    e.target.value = '';
  };

  const handleDocDelete = async (index) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      await api.delete(`/api/projects/${id}/documents/${index}`);
      const docs = [...form.documents];
      docs.splice(index, 1);
      setForm(prev => ({ ...prev, documents: docs }));
      setMessage({ type: 'success', text: 'Document removed' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Delete failed' });
    }
  };

  const handleDocEdit = (doc, index) => {
    setEditingDoc(index);
    setDocForm({ name: doc.name || '', description: doc.description || '' });
    setDocEditDialog(true);
  };

  const handleDocSave = async () => {
    try {
      await api.put(`/api/projects/${id}/documents/${editingDoc}`, { name: docForm.name, description: docForm.description });
      const docs = [...form.documents];
      docs[editingDoc] = { ...docs[editingDoc], name: docForm.name, description: docForm.description };
      setForm(prev => ({ ...prev, documents: docs }));
      setDocEditDialog(false);
      setMessage({ type: 'success', text: 'Document updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    }
  };

  const handlePhotoClick = () => {
    if (imagePreview) setPhotoPreviewOpen(true);
  };

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
            documents: data.documents || [],
          });
          if (data.image) setImagePreview(data.image);
          setCreator(data.createdBy || null);
          setCreatedAt(data.createdAt || null);
          setApprover(data.approvedBy || null);
          setApprovedAt(data.approvedAt || null);
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
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, GIF, and WEBP allowed.' });
      return;
    }
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

  const removeImage = () => {
    setForm({ ...form, image: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
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
        documents: form.documents,
      };
      if (id) {
        await api.put(`/api/projects/${id}`, payload);
        setMessage({ type: 'success', text: 'Project updated successfully!' });
      } else {
        const res = await api.post('/api/projects', payload);
        navigate(`/projects/${res.data._id}/edit`);
        return;
      }
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save project';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this project permanently?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/projects/${id}`);
      setMessage({ type: 'success', text: 'Project deleted' });
      setTimeout(() => navigate('/projects'), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Delete failed' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!form.name) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    const photoHtml = imagePreview ? `<img src="${imagePreview}" style="max-width:200px; border:1px solid #ccc; margin:5px 0;" />` : '';

    let docsHtml = '';
    if (form.documents && form.documents.length > 0) {
      docsHtml = `
        <h3>Attached Documents</h3>
        <ul>
          ${form.documents.map(doc => `
            <li>
              <strong>${doc.name || 'Untitled'}</strong>
              ${doc.description ? ` – ${doc.description}` : ''}
              ${doc.uploadedAt ? ` (Uploaded: ${new Date(doc.uploadedAt).toLocaleString()})` : ''}
            </li>
          `).join('')}
        </ul>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Project</title>
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
              <span class="left">PROJECT</span>
            </div>
            <div class="info">
              ${photoHtml ? `<div class="photo-container">${photoHtml}</div>` : ''}
              <p><strong>Name:</strong> ${form.name}</p>
              <p><strong>Location:</strong> ${form.location || '—'}</p>
              <p><strong>Budget:</strong> K ${parseFloat(form.budget).toFixed(2)}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              <p><strong>Progress:</strong> ${form.progress}%</p>
              <p><strong>Description:</strong> ${form.description || '—'}</p>
              ${creator ? `<p><strong>Created by:</strong> ${creator.name} (${creator.role})</p>` : ''}
              ${createdAt ? `<p><strong>Created on:</strong> ${new Date(createdAt).toLocaleString()}</p>` : ''}
            </div>
            ${docsHtml}
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

  if (loading && id && !isNew) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {isView && <Alert severity="info" sx={{ mb: 2 }}>You are viewing this project in read‑only mode.</Alert>}
      {isReadOnly && !isView && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access. Edits are disabled.</Alert>}

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
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            {isView ? 'VIEW PROJECT' : isNew ? 'CREATE PROJECT' : 'EDIT PROJECT'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `Project ID: ${id.slice(-6)}` : 'New Project'}
          </Typography>
        </Box>

        {/* ─── Creator info with safe checks ────────────────────── */}
        <Box sx={{ mb: 2 }}>
          {creator ? (
            <>
              <Typography variant="body2">Created by: <strong>{creator.name}</strong> ({creator.role})</Typography>
              <Typography variant="body2" color="textSecondary">Created on: {formatDate(createdAt)}</Typography>
            </>
          ) : (
            <Typography variant="body2" color="textSecondary">Created by: Unknown</Typography>
          )}
        </Box>

        {/* ─── Documents Section ──────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, border: '2px solid #1976d2', backgroundColor: '#f5f9ff' }}>
          <Accordion expanded={docExpanded} onChange={() => setDocExpanded(!docExpanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                📄 Documents ({form.documents?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {!isReadOnly && (
                <Box sx={{ mb: 2 }}>
                  {id ? (
                    <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                      Upload Document
                      <input type="file" hidden onChange={handleDocUpload} />
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Please save the project first before uploading documents.
                    </Alert>
                  )}
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                    Supported: images, PDF, Word, Excel (max 50MB)
                  </Typography>
                </Box>
              )}
              {form.documents && form.documents.length > 0 ? (
                form.documents.map((doc, idx) => {
                  const fullUrl = getFileUrl(doc.path);
                  const isImage = doc.mimeType?.startsWith('image/');
                  const isPdf = doc.mimeType === 'application/pdf';
                  return (
                    <Box key={idx} sx={{ mb: 2, border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{doc.name}</Typography>
                          <Typography variant="caption" display="block" color="textSecondary">
                            {doc.mimeType || 'Unknown'} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ''}
                          </Typography>
                          {doc.description && (
                            <Typography variant="body2" color="textSecondary">
                              {doc.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!isReadOnly && id && (
                            <>
                              <Tooltip title="Edit name/description">
                                <IconButton size="small" onClick={() => handleDocEdit(doc, idx)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDocDelete(idx)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Download">
                            <IconButton size="small" component="a" href={fullUrl} target="_blank" download>
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1, bgcolor: '#fff', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                        {isImage ? (
                          <Box sx={{ textAlign: 'center', maxHeight: '300px', overflow: 'auto' }}>
                            <img src={fullUrl} alt={doc.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                          </Box>
                        ) : isPdf ? (
                          <Box sx={{ height: '400px' }}>
                            <iframe src={fullUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={doc.name} />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="body2" color="textSecondary">Preview not available for this file type.</Typography>
                            <Button component="a" href={fullUrl} target="_blank" variant="contained" sx={{ mt: 1 }}>Download</Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" color="textSecondary">No documents uploaded.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* ─── Photo Upload ────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Project Photo</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar
              src={imagePreview || '/project-placeholder.jpg'}
              sx={{ width: 100, height: 100, borderRadius: 2, border: '1px solid #ccc', cursor: imagePreview ? 'pointer' : 'default' }}
              variant="rounded"
              onClick={handlePhotoClick}
            />
            {!isReadOnly && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CameraAltIcon />}
                >
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" hidden onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={removeImage}>
                    Remove
                  </Button>
                )}
              </>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">JPEG, PNG, GIF, WEBP</Typography>
        </Box>

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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={form.status || 'planning'}
              onChange={e => setForm({ ...form, status: e.target.value })}
              disabled={isReadOnly}
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography gutterBottom>Progress: {form.progress}%</Typography>
            <Slider
              value={form.progress}
              onChange={(e, val) => setForm({ ...form, progress: val })}
              min={0}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              disabled={isReadOnly}
            />
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
              disabled={isReadOnly}
            />
          </Grid>
        </Grid>

        {/* ─── Approval block with safe checks ────────────────────── */}
        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Prepared by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {creator ? `${creator.name} (${creator.role})` : '—'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {createdAt ? `Date: ${formatDate(createdAt)}` : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {createdAt ? formatDate(createdAt) : '—'}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {approver ? (
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

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {!isReadOnly && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : isNew ? 'Create Project' : 'Update Project'}
            </Button>
          )}
          {id && !isReadOnly && canDelete && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/projects')}>Cancel</Button>
        </Box>
      </form>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Project Image</span>
          <IconButton onClick={() => setPhotoPreviewOpen(false)}>
            <ZoomInIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Project"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Document Edit Dialog ────────────────────────────────── */}
      <Dialog open={docEditDialog} onClose={() => setDocEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <TextField
            label="Document Name"
            fullWidth
            margin="dense"
            value={docForm.name}
            onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            value={docForm.description}
            onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDocSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProjectForm;