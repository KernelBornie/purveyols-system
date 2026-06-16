import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);
  useEffect(() => {
    api.get('/api/workers').then(res => setWorkers(res.data)).catch(err => console.log(err));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">Workers</Typography>
      <Button component={Link} to="/workers/new" variant="contained" sx={{ mb: 2 }}>Enroll Worker</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>NRC</TableCell>
            <TableCell>Site</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Enrolled By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workers.map(w => (
            <TableRow key={w._id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.nrc}</TableCell>
              <TableCell>{w.site}</TableCell>
              <TableCell>{w.project?.name || '—'}</TableCell>
              <TableCell>{w.dailyRate}</TableCell>
              <TableCell>{w.enrolledBy ? `${w.enrolledBy.name} (${w.enrolledBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default WorkerList;
