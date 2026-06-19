import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const projectImages = ['project-1.jpg', 'project-3.jpg', 'project-4.jpg', 'project-5.jpg'];

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchProjects();
  }, []);

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
        <Button
          component={Link}
          to="/projects/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Project
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Budget</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Manager</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project, index) => (
              <TableRow key={project._id}>
                <TableCell>
                  <img
                    src={`/${projectImages[index % projectImages.length]}`}
                    alt={project.name}
                    style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                  />
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.location || '—'}</TableCell>
                <TableCell>
                  <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(project.budget || 0)}
                </TableCell>
                <TableCell>{project.manager?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton
                      component={Link}
                      to={`/projects/${project._id}`}
                      size="small"
                      color="info"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/projects/${project._id}`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No projects yet. Click "New Project" to create one.
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

export default ProjectList;
