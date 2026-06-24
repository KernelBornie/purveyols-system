import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ✅ Allowed to edit: admin, director, civil-engineer, foreman, accountant, qs
  const canEditWorker = ['admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs'].includes(user?.role);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker?')) return;
    try {
      await api.delete(`/api/workers/${id}`);
      fetchWorkers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Workers
        </Typography>
        {canEditWorker && (
          <Button
            component={Link}
            to="/workers/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Enroll Worker
          </Button>
        )}
      </Box>

      {!canEditWorker && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view‑only access. You can view workers but cannot create, edit, or delete them.
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Name</TableCell>
              <TableCell>NRC</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker._id}>
                <TableCell>{worker.name}</TableCell>
                <TableCell>{worker.nrc}</TableCell>
                <TableCell>{worker.phone}</TableCell>
                <TableCell>
                  <Chip label={worker.status} color={getStatusColor(worker.status)} size="small" />
                </TableCell>
                <TableCell>K {worker.rate || worker.dailyRate}</TableCell>
                <TableCell>{worker.site || '—'}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton component={Link} to={`/workers/${worker._id}`} size="small" color="info">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {canEditWorker && (
                    <Tooltip title="Edit">
                      <IconButton component={Link} to={`/workers/${worker._id}/edit`} size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {canEditWorker && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(worker._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No workers enrolled yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default WorkerList;