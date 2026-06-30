import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, Alert, IconButton, Tooltip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, OutlinedInput
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import LaunchIcon from '@mui/icons-material/Launch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

const EDITABLE_ROLES = ['admin', 'director', 'accountant', 'engineer', 'quantity-surveyor'];
const DELETABLE_ROLES = ['admin', 'director'];

const APPROVE_ROLES = ['admin', 'director', 'accountant'];
const ASSIGN_ROLES = ['admin', 'director', 'accountant', 'engineer', 'quantity-surveyor'];
const VERIFY_ROLES = ['admin', 'director', 'accountant'];
const AWARD_ROLES = ['director'];
const CREATE_PROJECT_ROLES = ['admin', 'director', 'accountant', 'engineer', 'quantity-surveyor'];

const TenderList = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('👤 Current user role:', user.role);
    } else {
      console.warn('⚠️ No user found in AuthContext');
    }
  }, [user]);

  const canEdit = user && EDITABLE_ROLES.includes(user.role);
  const canDelete = user && DELETABLE_ROLES.includes(user.role);

  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningTenderId, setAssigningTenderId] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data || []);
    } catch (err) {
      alert('Failed to load users: ' + getApiErrorMessage(err));
    } finally {
      setUsersLoading(false);
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

  const handleConvertToProject = async (tenderId) => {
    if (!window.confirm('Create a project from this awarded tender?')) return;
    try {
      const res = await api.post(`/api/tenders/${tenderId}/convert-to-project`);
      alert(`✅ Project "${res.data.project.name}" created successfully!`);
      fetchTenders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to create project'));
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this tender?')) return;
    try {
      await api.put(`/api/tenders/${id}/approve`);
      fetchTenders();
      alert('Tender approved!');
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleAssignOpen = async (tenderId) => {
    setAssigningTenderId(tenderId);
    setSelectedUserIds([]);
    await fetchUsers();
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedUserIds || selectedUserIds.length === 0) {
      alert('Please select at least one user to assign.');
      return;
    }
    try {
      await api.put(`/api/tenders/${assigningTenderId}/assign`, { assigneeIds: selectedUserIds });
      alert('Tender assigned successfully!');
      setAssignDialogOpen(false);
      fetchTenders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to assign'));
    }
  };

  const handleVerify = async (id) => {
    if (!window.confirm('Verify this approved tender?')) return;
    try {
      await api.put(`/api/tenders/${id}/verify`);
      fetchTenders();
      alert('Tender verified!');
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleAward = async (id) => {
    const awardAmount = prompt('Enter award amount (or leave blank to use tender total):');
    const awardee = prompt('Enter awardee (or leave blank to use client name):');
    try {
      const res = await api.put(`/api/tenders/${id}/award`, {
        awardAmount: awardAmount ? parseFloat(awardAmount) : undefined,
        awardee: awardee || undefined,
      });
      alert(res.data.message || 'Tender awarded and project created!');
      fetchTenders();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleUploadHardCopy = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^.]+$/, ''));
    formData.append('referenceNumber', `HCT-${Date.now()}`);
    try {
      const res = await api.post('/api/tenders/upload-hardcopy', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Hard copy tender uploaded!');
      navigate(`/tenders/${res.data.tender._id}/edit`);
      fetchTenders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Upload failed'));
    }
    e.target.value = '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'verified': return 'info';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tenders & RFQs</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button component={Link} to="/tenders/new" variant="contained" startIcon={<AddIcon />}>
              New Tender / RFQ
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Upload Hard Copy
            <input
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={handleUploadHardCopy}
            />
          </Button>
        </Box>
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
            <TableCell>Assigned Staff</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Approved By</TableCell>
            <TableCell>Verified By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenders.map((t) => {
            const isCreator = user && t.createdBy && t.createdBy._id === user.id;
            const canEditThis = (canEdit || isCreator) && t.status !== 'submitted' && t.status !== 'verified' && t.status !== 'awarded';

            const canApprove = t.status === 'submitted' && user && APPROVE_ROLES.includes(user.role);
            const canAssign = (t.status === 'approved' || t.status === 'verified') && user && ASSIGN_ROLES.includes(user.role);
            const canVerify = t.status === 'approved' && user && VERIFY_ROLES.includes(user.role);
            const canAward = t.status === 'verified' && user && AWARD_ROLES.includes(user.role);
            const canCreateProject = t.status === 'awarded' && !t.convertedToProject && user && CREATE_PROJECT_ROLES.includes(user.role);

            const assignedNames = t.assignedStaff && t.assignedStaff.length > 0
              ? t.assignedStaff.map(s => `${s.name} (${s.role})`).join(', ')
              : '—';

            return (
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
                <TableCell>{assignedNames}</TableCell>
                <TableCell>
                  {t.convertedToProject ? (
                    <Button
                      component={Link}
                      to={`/projects/${t.convertedToProject._id}`}
                      size="small"
                      variant="outlined"
                      endIcon={<LaunchIcon />}
                    >
                      {t.convertedToProject.name}
                    </Button>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {t.createdBy ? `${t.createdBy.name} (${t.createdBy.role})` : '—'}
                </TableCell>
                <TableCell>
                  {t.approvedBy ? `${t.approvedBy.name} (${t.approvedBy.role})` : '—'}
                </TableCell>
                <TableCell>
                  {t.verifiedBy ? `${t.verifiedBy.name} (${t.verifiedBy.role})` : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    component={Link}
                    to={`/tenders/${t._id}/view`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, textTransform: 'none' }}
                  >
                    View
                  </Button>

                  {canEditThis && (
                    <Button
                      component={Link}
                      to={`/tenders/${t._id}/edit`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                  )}

                  {canDelete && t.status !== 'awarded' && t.status !== 'verified' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Delete
                    </Button>
                  )}

                  {canApprove && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Approve
                    </Button>
                  )}

                  {canAssign && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleAssignOpen(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Assign
                    </Button>
                  )}

                  {canVerify && !t.verifiedBy && (
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => handleVerify(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Verify
                    </Button>
                  )}

                  {canAward && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => handleAward(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Award
                    </Button>
                  )}

                  {canCreateProject && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleConvertToProject(t._id)}
                      sx={{ mr: 0.5, textTransform: 'none' }}
                    >
                      Create Project
                    </Button>
                  )}

                  {t.convertedToProject && (
                    <Chip label="✅ Project" size="small" color="success" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {tenders.length === 0 && (
            <TableRow>
              <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No tenders or RFQs yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Staff</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
            Select one or more users to assign to this tender.
          </Typography>
          {usersLoading ? (
            <CircularProgress size={24} />
          ) : (
            <FormControl fullWidth>
              <InputLabel id="assign-users-label">Select Users</InputLabel>
              <Select
                labelId="assign-users-label"
                multiple
                value={selectedUserIds}
                onChange={(e) => setSelectedUserIds(e.target.value)}
                input={<OutlinedInput label="Select Users" />}
                renderValue={(selected) => {
                  const names = selected.map(id => {
                    const user = users.find(u => u._id === id);
                    return user ? `${user.name} (${user.role})` : id;
                  });
                  return names.join(', ');
                }}
              >
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSubmit} disabled={!selectedUserIds.length || usersLoading}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TenderList;