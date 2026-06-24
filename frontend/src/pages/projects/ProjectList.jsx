import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip, Alert, LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const canApprove = ['admin', 'director'].includes(user?.role);
  const canEdit = !['driver', 'receptionist', 'safety-officer'].includes(user?.role);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/projects/${id}/approve`);
      fetchProjects();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this project?')) return;
    try {
      await api.put(`/api/projects/${id}/reject`);
      fetchProjects();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert('Delete failed');
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

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Projects
        </Typography>
        {canEdit && (
          <Button
            component={Link}
            to="/projects/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            New Project
          </Button>
        )}
      </Box>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view‑only access. You can view projects but cannot create, edit, or delete them.
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Bidder</TableCell>
              <TableCell>Bid Source</TableCell>
              <TableCell>Bid Amount</TableCell>
              <TableCell>Assigned Staff</TableCell>
              <TableCell>Time Frame</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project._id}>
                <TableCell>
                  <img
                    src={project.image || '/project-placeholder.jpg'}
                    alt={project.name}
                    style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                  />
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.location || '—'}</TableCell>
                <TableCell>
                  <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                </TableCell>
                <TableCell sx={{ minWidth: 100 }}>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">{project.progress || 0}%</Typography>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(project.budget || 0)}
                </TableCell>
                <TableCell>
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>{project.bidder?.name || '—'}</TableCell>
                <TableCell>
                  {project.bidSource ? (
                    <Tooltip title={project.sourceUrl || ''}>
                      <span>{project.bidSource}</span>
                    </Tooltip>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {project.bidAmount ? new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(project.bidAmount) : '—'}
                </TableCell>
                <TableCell>
                  {project.assignedStaff?.map(staff => staff.name).join(', ') || '—'}
                </TableCell>
                <TableCell>{project.timeFrame || '—'}</TableCell>
                <TableCell>{project.manager?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton component={Link} to={`/projects/${project._id}`} size="small" color="info">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {canEdit && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton component={Link} to={`/projects/${project._id}/edit`} size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Planning">
                        <IconButton component={Link} to={`/projects/${project._id}/planning`} size="small" color="secondary">
                          <TimelineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(project._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  {canApprove && project.status === 'planning' && (
                    <>
                      <Tooltip title="Approve">
                        <IconButton size="small" color="success" onClick={() => handleApprove(project._id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => handleReject(project._id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No projects yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default ProjectList;