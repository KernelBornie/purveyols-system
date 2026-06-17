import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data)).catch(err => console.log(err));
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Typography variant="h5" gutterBottom>Projects</Typography>
      <Button component={Link} to="/projects/new" variant="contained" sx={{ mb: 2 }}>Create Project</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.location}</TableCell>
              <TableCell>
                <Chip
                  label={p.status}
                  color={p.status === 'active' ? 'success' : p.status === 'planning' ? 'info' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>{p.budget}</TableCell>
              <TableCell>{p.createdBy ? `${p.createdBy.name} (${p.createdBy.role})` : 'N/A'}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/projects/${p._id}`}
                  variant="outlined"
                  size="small"
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProjectList;
