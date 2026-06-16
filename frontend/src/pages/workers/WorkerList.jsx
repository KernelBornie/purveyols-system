import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography, Chip } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    api.get('/api/workers').then(res => setWorkers(res.data)).catch(err => console.log(err));
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Workers</Typography>
      <Button component={Link} to="/workers/new" variant="contained" sx={{ mb: 2 }}>Enroll Worker</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>NRC</TableCell>
            <TableCell>Site</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Enrolled By</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Paid</TableCell>
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
              <TableCell>{w.enrolledBy ? `${w.enrolledBy.name} (${w.enrolledBy.role})` : 'N/A'}</TableCell>
              <TableCell>
                <Chip label={w.balance?.toFixed(2) || '0.00'} color={w.balance > 0 ? 'warning' : 'success'} size="small" />
              </TableCell>
              <TableCell>{w.totalPaid?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <Button component={Link} to={`/workers/${w._id}`} size="small" variant="outlined">Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default WorkerList;
