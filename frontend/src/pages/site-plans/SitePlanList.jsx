import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const SitePlanList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/site-plans');
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/api/site-plans/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'submitted': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      site_plan: 'Site Plan',
      fence_drawing: 'Fence Drawing',
      access_plan: 'Access Plan',
      boundary_fence: 'Boundary Fence',
      survey_data: 'Survey Data',
    };
    return map[type] || type;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Site Plans & Surveying
        </Typography>
        <Button
          component={Link}
          to="/site-plans/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Drawing / Plan
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Dimensions</TableCell>
              <TableCell>Drawing</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan._id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{getTypeLabel(plan.type)}</TableCell>
                <TableCell>{plan.project?.name || 'N/A'}</TableCell>
                <TableCell>{plan.dimensions || '—'}</TableCell>
                <TableCell>
                  {plan.drawingImage ? (
                    <img
                      src={plan.drawingImage}
                      alt={plan.name}
                      style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    <Typography variant="caption" color="textSecondary">No drawing</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={plan.status} color={getStatusColor(plan.status)} size="small" />
                </TableCell>
                <TableCell>{plan.createdBy?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton component={Link} to={`/site-plans/${plan._id}`} size="small" color="info">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton component={Link} to={`/site-plans/${plan._id}/edit`} size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(plan._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No plans yet. Click "New Drawing / Plan" to start.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default SitePlanList;
