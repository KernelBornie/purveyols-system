import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip, Alert, LinearProgress,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stepper, Step, StepLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

// ─── Shared allowed roles (exactly as in WorkerList) ────────────
const ALLOWED_EDIT_ROLES = [
  'admin', 'director', 'civil-engineer', 'foreman',
  'accountant', 'qs', 'quantity-surveyor'
];

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ─── Fallback: read user from localStorage ──────────────────
  const [localUser, setLocalUser] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const effectiveUser = user || localUser;

  // ─── Permission checks (same as Workers) ────────────────────
  const canEdit = effectiveUser && ALLOWED_EDIT_ROLES.includes(effectiveUser.role);
  const canDelete = effectiveUser && ['admin', 'director', 'accountant'].includes(effectiveUser.role);
  const canApprove = effectiveUser && ['admin', 'director'].includes(effectiveUser.role);

  // ─── Debug logs ─────────────────────────────────────────────
  console.log('👤 effectiveUser:', effectiveUser);
  console.log('🔑 effectiveUser.role:', effectiveUser?.role);
  console.log('✅ canEdit:', canEdit);

  // ─── Photo preview state ──────────────────────────────────────
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // ─── Upload modal state ──────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/projects/${id}/approve`);
      fetchProjects();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this project?')) return;
    try {
      await api.put(`/api/projects/${id}/reject`);
      fetchProjects();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const handlePhotoClick = (image) => {
    if (image) {
      setPreviewImage(image);
      setPhotoPreviewOpen(true);
    }
  };

  // ─── Upload handlers ──────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadErrors([]);
    setUploadStep(0);
    const reader = new FileReader();
    reader.onload = () => setUploadStep(1);
    reader.readAsDataURL(file);
  };

  const handleUploadPreview = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post('/api/projects/upload/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadData(res.data.projects || []);
      setUploadErrors(res.data.errors || []);
      setUploadStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to parse file';
      setUploadErrors([msg]);
      setUploadStep(2);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile || uploadData.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post('/api/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStep(3);
      setUploadOpen(false);
      fetchProjects();
      setUploadFile(null);
      setUploadData([]);
      setUploadErrors([]);
      setUploadStep(0);
      alert(`✅ ${res.data.count} projects uploaded successfully!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      setUploadErrors([msg]);
      setUploadStep(2);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClose = () => {
    setUploadOpen(false);
    setUploadFile(null);
    setUploadData([]);
    setUploadErrors([]);
    setUploadStep(0);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Projects
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Projects
            </Button>
          )}
          {canEdit && (
            <Button
              component={Link}
              to="/projects/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              New Project
            </Button>
          )}
        </Box>
      </Box>

      {!canEdit && effectiveUser && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view‑only access. You can view projects but cannot create, edit, or delete them.
        </Alert>
      )}
      {!effectiveUser && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please log in to manage projects.
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Bidder</TableCell>
            <TableCell>Bid Source</TableCell>
            <TableCell>Bid Amount</TableCell>
            <TableCell>Assigned Staff</TableCell>
            <TableCell>Time Frame</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project._id}>
              <TableCell>
                <Box
                  sx={{ cursor: project.image ? 'pointer' : 'default' }}
                  onClick={() => handlePhotoClick(project.image)}
                >
                  <Avatar
                    src={project.image || '/project-placeholder.jpg'}
                    variant="rounded"
                    sx={{ width: 50, height: 40 }}
                  >
                    {!project.image && project.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </TableCell>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.location || '—'}</TableCell>
              <TableCell>
                <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <LinearProgress
                  variant="determinate"
                  value={project.progress || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption">{project.progress || 0}%</Typography>
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(project.budget || 0)}
              </TableCell>
              <TableCell>
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell>{project.bidder?.name || '—'}</TableCell>
              <TableCell>
                {project.bidSource ? (
                  <Tooltip title={project.sourceUrl || ''}>
                    <span>{project.bidSource}</span>
                  </Tooltip>
                ) : '—'}
              </TableCell>
              <TableCell>
                {project.bidAmount ? new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(project.bidAmount) : '—'}
              </TableCell>
              <TableCell>
                {project.assignedStaff?.map(staff => staff.name).join(', ') || '—'}
              </TableCell>
              <TableCell>{project.timeFrame || '—'}</TableCell>
              <TableCell>{project.manager?.name || 'N/A'}</TableCell>
              <TableCell>
                {/* ─── View ────────────────────────────────────── */}
                <Button
                  component={Link}
                  to={`/projects/${project._id}/view`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {canEdit && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton
                        component={Link}
                        to={`/projects/${project._id}/edit`}
                        size="small"
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Planning">
                      <IconButton
                        component={Link}
                        to={`/projects/${project._id}/planning`}
                        size="small"
                        color="secondary"
                      >
                        <TimelineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(project._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}

                {canApprove && project.status === 'planning' && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApprove(project._id)}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleReject(project._id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No projects yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Project Image</span>
          <IconButton onClick={() => setPhotoPreviewOpen(false)}>
            <ZoomInIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Project"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Upload Dialog ───────────────────────────────────────── */}
      <Dialog open={uploadOpen} onClose={handleUploadClose} maxWidth="md" fullWidth>
        <DialogTitle>Upload Projects</DialogTitle>
        <DialogContent>
          <Stepper activeStep={uploadStep} sx={{ my: 2 }}>
            <Step><StepLabel>Select File</StepLabel></Step>
            <Step><StepLabel>Preview</StepLabel></Step>
            <Step><StepLabel>Upload</StepLabel></Step>
          </Stepper>

          {uploadStep === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom>
                Upload a CSV or Excel file with project data.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Required column: <strong>name</strong>
                <br />
                Supported: location, budget, status, description, progress, endDate, image (base64)
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 2 }}
              >
                Choose File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>
          )}

          {uploadStep === 1 && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Parsing file... {uploading && <CircularProgress size={20} />}
              </Typography>
              <Button
                variant="contained"
                onClick={handleUploadPreview}
                disabled={uploading}
                sx={{ mt: 1 }}
              >
                Preview Data
              </Button>
              <Button
                variant="outlined"
                onClick={() => setUploadStep(0)}
                sx={{ mt: 1, ml: 1 }}
              >
                Back
              </Button>
            </Box>
          )}

          {uploadStep === 2 && (
            <Box>
              {uploadErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadErrors.map((err, i) => <div key={i}>• {err}</div>)}
                </Alert>
              )}
              <Typography variant="body2" gutterBottom>
                Found {uploadData.length} project(s) to upload.
              </Typography>
              <Table size="small" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadData.slice(0, 10).map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.location || '—'}</TableCell>
                      <TableCell>{p.budget || '—'}</TableCell>
                      <TableCell>{p.status || 'planning'}</TableCell>
                    </TableRow>
                  ))}
                  {uploadData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        ... and {uploadData.length - 10} more
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUploadConfirm}
                  disabled={uploading || uploadData.length === 0}
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </Button>
                <Button variant="outlined" onClick={() => setUploadStep(0)}>Back</Button>
              </Box>
            </Box>
          )}

          {uploadStep === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="success">✅ Upload Complete!</Typography>
              <Typography variant="body2">Projects have been created.</Typography>
              <Button variant="contained" onClick={() => setUploadOpen(false)} sx={{ mt: 2 }}>
                Close
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProjectList;