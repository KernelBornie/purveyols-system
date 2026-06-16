import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">Projects</Typography>
      <Button component={Link} to="/projects/new" variant="contained" sx={{ mb: 2 }}>Create Project</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell>Created By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.location}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>{p.budget}</TableCell>
              <TableCell>{p.createdBy ? `${p.createdBy.name} (${p.createdBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default ProjectList;
