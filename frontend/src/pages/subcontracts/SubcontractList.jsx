import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Tooltip, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const SubcontractList = () => {
  const [subcontracts, setSubcontracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canEdit = ['procurement-officer', 'civil-engineer', 'quantity-surveyor', 'director', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchSubcontracts();
  }, []);

  const fetchSubcontracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/subcontracts');
      setSubcontracts(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load subcontracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subcontract?')) return;
    try {
      await api.delete(`/api/subcontracts/${id}`);
      fetchSubcontracts();
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
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Subcontracts</Typography>
        {canEdit && (
          <Button component={Link} to="/subcontracts/new" variant="contained" startIcon={<AddIcon />}>
            New Subcontract
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Project</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subcontracts.map((sc) => (
            <TableRow key={sc._id}>
              <TableCell>{sc.project?.name || '—'}</TableCell>
              <TableCell>{sc.vendor}</TableCell>
              <TableCell>{sc.service}</TableCell>
              <TableCell>K {sc.amount?.toLocaleString() || '0'}</TableCell>
              <TableCell>{sc.status}</TableCell>
              <TableCell>{sc.startDate ? new Date(sc.startDate).toLocaleDateString() : '—'}</TableCell>
              <TableCell>
                <Tooltip title="View">
                  <IconButton component={Link} to={`/subcontracts/${sc._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canEdit && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton component={Link} to={`/subcontracts/${sc._id}/edit`} size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(sc._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {subcontracts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">No subcontracts yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default SubcontractList;
