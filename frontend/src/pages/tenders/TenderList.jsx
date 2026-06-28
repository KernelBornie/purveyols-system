import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, Alert, IconButton, Tooltip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

// ─── Expanded roles that can edit/delete ─────────────────────────
const EDITABLE_ROLES = [
  'admin', 'director', 'procurement-officer', 'accountant',
  'civil-engineer', 'quantity-surveyor', 'foreman', 'safety-officer',
  'engineer', 'manager', 'supervisor', 'planner', 'estimator',
  'surveyor', 'architect', 'project-manager', 'site-engineer',
  'construction-manager', 'quality-control', 'store-keeper'
];

const DELETABLE_ROLES = ['admin', 'director', 'accountant'];

const TenderList = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canEdit = user && EDITABLE_ROLES.includes(user.role);
  const canDelete = user && DELETABLE_ROLES.includes(user.role);

  // ─── Photo preview state ──────────────────────────────────────
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/tenders');
      setTenders(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tenders'));
      setTenders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tender?')) return;
    try {
      await api.delete(`/api/tenders/${id}`);
      fetchTenders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  // ─── NEW: Convert awarded tender to Project ──────────────────
  const handleConvertToProject = async (tenderId) => {
    if (!window.confirm('Create a project from this awarded tender?')) return;
    try {
      const res = await api.post(`/api/tenders/${tenderId}/convert-to-project`);
      alert(`✅ Project "${res.data.project.name}" created successfully!`);
      fetchTenders(); // refresh list
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to create project'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'awarded': return 'success';
      case 'rejected': return 'error';
      case 'not_awarded': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      solicitation: 'Solicitation',
      rfq: 'RFQ',
      tender: 'Tender',
      proposal: 'Proposal',
      bid: 'Bid',
    };
    return map[type] || type;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const handlePhotoClick = (image) => {
    if (image) {
      setPreviewImage(image);
      setPhotoPreviewOpen(true);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tenders & RFQs</Typography>
        {canEdit && (
          <Button component={Link} to="/tenders/new" variant="contained" startIcon={<AddIcon />}>
            New Tender / RFQ
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Image</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenders.map((t) => (
            <TableRow key={t._id}>
              <TableCell>
                <Box
                  sx={{ cursor: t.image ? 'pointer' : 'default' }}
                  onClick={() => handlePhotoClick(t.image)}
                >
                  <Avatar
                    src={t.image || '/tender-placeholder.jpg'}
                    variant="rounded"
                    sx={{ width: 40, height: 40 }}
                  >
                    {!t.image && t.title?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </TableCell>
              <TableCell>{t.referenceNumber}</TableCell>
              <TableCell>{t.title}</TableCell>
              <TableCell><Chip label={getTypeLabel(t.type)} size="small" color="primary" /></TableCell>
              <TableCell>{t.client}</TableCell>
              <TableCell>{t.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0}</TableCell>
              <TableCell>{formatCurrency(t.priceProposal?.grandTotal || 0)}</TableCell>
              <TableCell>
                <Chip label={t.status} size="small" color={getStatusColor(t.status)} />
              </TableCell>
              <TableCell>{t.createdBy?.name}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/tenders/${t._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, textTransform: 'none' }}
                >
                  View
                </Button>
                {canEdit && t.status !== 'submitted' && t.status !== 'awarded' && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/tenders/${t._id}`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canDelete && t.status !== 'awarded' && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(t._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {t.status === 'awarded' && !t.convertedToProject && (
                  <Tooltip title="Create Project">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleConvertToProject(t._id)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {t.convertedToProject && (
                  <Tooltip title="Project Created">
                    <Chip label="✅ Project" size="small" color="success" />
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {tenders.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No tenders or RFQs yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tender Image</span>
          <IconButton onClick={() => setPhotoPreviewOpen(false)}>
            <ZoomInIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Tender"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TenderList;