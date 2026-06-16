import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography, Chip } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const BOQList = () => {
  const [boqs, setBoqs] = useState([]);
  useEffect(() => {
    api.get('/api/boq').then(res => setBoqs(res.data));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">BOQ</Typography>
      <Button component={Link} to="/boq/new" variant="contained" sx={{ mb: 2 }}>Create BOQ</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {boqs.map(b => (
            <TableRow key={b._id}>
              <TableCell>{b.project?.name}</TableCell>
              <TableCell>{b.items?.length || 0}</TableCell>
              <TableCell><Chip label={b.status} color={b.status==='approved'?'success':'default'} /></TableCell>
              <TableCell>{b.createdBy ? `${b.createdBy.name} (${b.createdBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default BOQList;
