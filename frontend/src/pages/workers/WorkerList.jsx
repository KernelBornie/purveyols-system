import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  Chip, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const WorkerList = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    api.get('/api/workers').then(res => setWorkers(res.data)).catch(err => console.log(err));
  }, []);

  const handleMenuOpen = (event, worker) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorker(worker);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/api/workers/${id}/${status}`);
      const res = await api.get('/api/workers');
      setWorkers(res.data);
    } catch (err) { alert('Failed to update worker status'); }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;
    try {
      await api.delete(`/api/workers/${selectedWorker._id}`);
      const res = await api.get('/api/workers');
      setWorkers(res.data);
      setDeleteDialog(false);
    } catch (err) { alert('Failed to delete worker'); }
    handleMenuClose();
  };

  const isDirectorOrAccountant = user?.role === 'director' || user?.role === 'accountant';

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Typography variant="h5" gutterBottom>Workers</Typography>
      <Button component={Link} to="/workers/new" variant="contained" sx={{ mb: 2 }}>Enroll Worker</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>NRC</TableCell>
            <TableCell>Site</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Enrolled By</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workers.map(w => (
            <TableRow key={w._id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.nrc}</TableCell>
              <TableCell>{w.site}</TableCell>
              <TableCell>{w.dailyRate}</TableCell>
              <TableCell>
                <Chip
                  label={w.status || 'active'}
                  color={w.status === 'active' ? 'success' : w.status === 'suspended' ? 'error' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell>{w.enrolledBy ? `${w.enrolledBy.name} (${w.enrolledBy.role})` : 'N/A'}</TableCell>
              <TableCell>{(w.balance || 0).toFixed(2)}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, w)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedWorker?._id === w._id} onClose={handleMenuClose}>
                  <MenuItem component={Link} to={`/workers/${w._id}`}>Edit</MenuItem>
                  {isDirectorOrAccountant && (
                    <>
                      <MenuItem onClick={() => handleStatusChange(w._id, 'activate')}>Activate</MenuItem>
                      <MenuItem onClick={() => handleStatusChange(w._id, 'deactivate')}>Deactivate</MenuItem>
                      <MenuItem onClick={() => handleStatusChange(w._id, 'suspend')}>Suspend</MenuItem>
                      <MenuItem onClick={() => setDeleteDialog(true)}>Delete</MenuItem>
                    </>
                  )}
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Worker?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete {selectedWorker?.name}? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkerList;
