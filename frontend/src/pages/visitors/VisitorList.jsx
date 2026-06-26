import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const VisitorList = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const canEdit = ['admin', 'director', 'receptionist', 'security', 'civil-engineer', 'foreman'].includes(user?.role);
  const canDelete = ['admin', 'director'].includes(user?.role);
  const canCheckOut = ['admin', 'director', 'receptionist', 'security'].includes(user?.role);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/visitors');
      setVisitors(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await api.put(`/api/visitors/${id}/checkout`);
      fetchVisitors();
    } catch (err) {
      alert('Check-out failed');
    }
  };

  const handleDeleteClick = (visitor) => {
    setSelectedVisitor(visitor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVisitor) return;
    try {
      await api.delete(`/api/visitors/${selectedVisitor._id}`);
      setDeleteDialogOpen(false);
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedVisitor(null);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Visitors</Typography>
        {canEdit && (
          <Button component={Link} to="/visitors/new" variant="contained" startIcon={<AddIcon />}>
            New Visitor
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>ID Number</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Purpose</TableCell>
            <TableCell>Check-In</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visitors.map((v) => (
            <TableRow key={v._id}>
              <TableCell>{v.name}</TableCell>
              <TableCell>{v.phone || '—'}</TableCell>
              <TableCell>{v.idNumber || '—'}</TableCell>
              <TableCell>{v.company || '—'}</TableCell>
              <TableCell>{v.project?.name || '—'}</TableCell>
              <TableCell>{v.purpose || '—'}</TableCell>
              <TableCell>{new Date(v.checkIn).toLocaleString()}</TableCell>
              <TableCell>
                <Chip
                  label={v.status}
                  color={v.status === 'inside' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {/* ─── View button (text) ──────────────────────────── */}
                <Button
                  component={Link}
                  to={`/visitors/${v._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {/* ─── Edit ────────────────────────────────────────── */}
                {canEdit && v.status === 'inside' && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/visitors/${v._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* ─── Check Out ────────────────────────────────────── */}
                {canCheckOut && v.status === 'inside' && (
                  <Tooltip title="Check Out">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleCheckOut(v._id)}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* ─── Delete ───────────────────────────────────────── */}
                {canDelete && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(v)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {visitors.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No visitors yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ─── Delete Dialog ──────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Visitor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete visitor <strong>{selectedVisitor?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VisitorList;