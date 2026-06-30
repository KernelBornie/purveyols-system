import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const BOQList = () => {
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canApprove = ['admin', 'director', 'accountant'].includes(user?.role);
  const canEdit = ['admin', 'director', 'civil-engineer', 'quantity-surveyor', 'procurement-officer', 'accountant', 'foreman'].includes(user?.role);

  useEffect(() => {
    fetchBOQs();
  }, []);

  const fetchBOQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/boq');
      setBoqs(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load BOQs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/boq/${id}/approve`);
      fetchBOQs();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/boq/${id}/reject`, { reason });
      fetchBOQs();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this BOQ?')) return;
    try {
      await api.delete(`/api/boq/${id}`);
      fetchBOQs();
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bills of Quantities (BOQ)</Typography>
        {canEdit && (
          <Button component={Link} to="/boq/new" variant="contained" startIcon={<AddIcon />}>
            New BOQ
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Project</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Approved By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {boqs.map((boq) => (
            <TableRow key={boq._id}>
              <TableCell>{boq.project?.name || '—'}</TableCell>
              <TableCell>{boq.description || '-'}</TableCell>
              <TableCell>{boq.items?.length || 0}</TableCell>
              <TableCell>ZMW {boq.grandTotal?.toLocaleString() || '0'}</TableCell>
              <TableCell>
                <Chip
                  label={boq.status}
                  color={boq.status === 'approved' ? 'success' : boq.status === 'submitted' ? 'warning' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {boq.createdBy ? `${boq.createdBy.name} (${boq.createdBy.role})` : '—'}
              </TableCell>
              <TableCell>
                {boq.approvedBy ? `${boq.approvedBy.name} (${boq.approvedBy.role})` : '—'}
              </TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/boq/${boq._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {canEdit && boq.status !== 'approved' && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/boq/${boq._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {canEdit && boq.status !== 'approved' && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(boq._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {canApprove && boq.status === 'submitted' && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApprove(boq._id)}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleReject(boq._id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {boqs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">No BOQs yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default BOQList;