import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

const EDITABLE_ROLES = [
  'admin', 'director', 'procurement-officer', 'accountant',
  'civil-engineer', 'quantity-surveyor', 'foreman', 'safety-officer',
  'engineer', 'manager', 'supervisor', 'planner', 'estimator',
  'surveyor', 'architect', 'project-manager', 'site-engineer',
  'construction-manager', 'quality-control', 'store-keeper'
];

const DELETABLE_ROLES = ['admin', 'director', 'accountant'];

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // ─── DEBUG ──────────────────────────────────────────────────────
  console.log('🔍 ProjectList user:', user);
  console.log('🔍 ProjectList user.role:', user?.role);
  console.log('🔍 canEdit:', user && EDITABLE_ROLES.includes(user.role));
  console.log('🔍 canDelete:', user && DELETABLE_ROLES.includes(user.role));

  // ─── TEMPORARY FORCE (uncomment to test) ──────────────────────
  // const canEdit = true;
  // const canDelete = true;

  const canEdit = user && EDITABLE_ROLES.includes(user.role);
  const canDelete = user && DELETABLE_ROLES.includes(user.role);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error('Fetch projects error:', err);
      setError(getApiErrorMessage(err, 'Failed to load projects. Please try again.'));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Projects</Typography>
        {canEdit && (
          <Button component={Link} to="/projects/new" variant="contained" startIcon={<AddIcon />}>
            New Project
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project._id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.location || '—'}</TableCell>
              <TableCell>
                <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
              </TableCell>
              <TableCell>{project.progress || 0}%</TableCell>
              <TableCell>{formatCurrency(project.budget || 0)}</TableCell>
              <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</TableCell>
              <TableCell>{project.manager?.name || 'N/A'}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/projects/${project._id}/view`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                >
                  View
                </Button>

                {canEdit && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton
                        component={Link}
                        to={`/projects/${project._id}/edit`}
                        size="small"
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Planning">
                      <IconButton
                        component={Link}
                        to={`/projects/${project._id}/planning`}
                        size="small"
                        color="secondary"
                      >
                        <TimelineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(project._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No projects yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProjectList;
