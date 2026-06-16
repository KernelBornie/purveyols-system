import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography, Chip } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const FundingRequestList = () => {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    api.get('/api/funding-requests').then(res => setRequests(res.data));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">Funding Requests</Typography>
      <Button component={Link} to="/funding/new" variant="contained" sx={{ mb: 2 }}>New Request</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requested By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map(r => (
            <TableRow key={r._id}>
              <TableCell>{r.project?.name}</TableCell>
              <TableCell>{r.amount}</TableCell>
              <TableCell><Chip label={r.status} color={r.status==='approved'?'success':r.status==='rejected'?'error':'warning'} /></TableCell>
              <TableCell>{r.requestedBy ? `${r.requestedBy.name} (${r.requestedBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default FundingRequestList;
