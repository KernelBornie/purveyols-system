import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, IconButton, Alert, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Snackbar, Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import api from '../../api/axios';

const SafetyReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  // ─── Photo preview state ──────────────────────────────────────
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/safety-reports');
      setReports(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load safety reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/safety-reports/${deleteDialog.id}`);
      setSnackbar({ open: true, message: 'Report deleted', severity: 'success' });
      fetchReports();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'warning',
      submitted: 'info',
      reviewed: 'primary',
      resolved: 'success',
      passed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  // ─── Handle photo click to expand ────────────────────────────
  const handlePhotoClick = (imageData) => {
    if (imageData) {
      setPreviewImage(imageData);
      setPhotoPreviewOpen(true);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Safety Reports</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/safety-reports/new')}
        >
          New Report
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : reports.length === 0 ? (
          <Typography align="center" color="textSecondary">No safety reports</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Evidence</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>
                    {report.images && report.images.length > 0 ? (
                      <Avatar
                        src={report.images[0].dataURL}
                        variant="rounded"
                        sx={{ width: 40, height: 40, cursor: 'pointer' }}
                        onClick={() => handlePhotoClick(report.images[0].dataURL)}
                      >
                        <ZoomInIcon fontSize="small" />
                      </Avatar>
                    ) : (
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#eee' }}>
                        <ImageIcon fontSize="small" color="disabled" />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>{report.title || 'Untitled'}</TableCell>
                  <TableCell>{report.location || '-'}</TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.createdBy?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {/* ─── View button (text) ──────────────────────────── */}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/safety-reports/${report._id}`)}
                      sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                    >
                      View
                    </Button>

                    <IconButton
                      size="small"
                      onClick={() => navigate(`/safety-reports/${report._id}/edit`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, id: report._id })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Evidence Image</span>
          <IconButton onClick={() => setPhotoPreviewOpen(false)}>
            <ZoomInIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Evidence"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this safety report?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

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

export default SafetyReportList;