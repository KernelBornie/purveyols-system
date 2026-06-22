import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  IconButton, Tooltip, Box, Alert, CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const DeliveryNoteList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // ✅ Foreman added
  const canEdit = ['procurement-officer', 'civil-engineer', 'quantity-surveyor', 'director', 'admin', 'driver', 'accountant', 'foreman'].includes(user?.role);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/delivery');
      setNotes(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load delivery notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery note permanently?')) return;
    try {
      await api.delete(`/api/delivery/${id}`);
      fetchNotes();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Delivery Notes</Typography>
        {canEdit && (
          <Button component={Link} to="/delivery/new" variant="contained" startIcon={<AddIcon />}>
            New Delivery Note
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>No.</TableCell>
            <TableCell>M/S</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notes.map(n => (
            <TableRow key={n._id}>
              <TableCell>{n.noteNumber}</TableCell>
              <TableCell>{n.ms || '-'}</TableCell>
              <TableCell>{new Date(n.date).toLocaleDateString()}</TableCell>
              <TableCell>{n.items?.length || 0}</TableCell>
              <TableCell>
                <Tooltip title="View">
                  <IconButton component={Link} to={`/delivery/${n._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canEdit && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton component={Link} to={`/delivery/${n._id}/edit`} size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(n._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <Tooltip title="Print">
                  <IconButton size="small" onClick={() => window.print()}>
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {notes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No delivery notes yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default DeliveryNoteList;
