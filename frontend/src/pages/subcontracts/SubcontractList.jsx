import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const SubcontractList = () => {
  const [subs, setSubs] = useState([]);
  useEffect(() => {
    api.get('/api/subcontracts').then(res => setSubs(res.data));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">Subcontracts</Typography>
      <Button component={Link} to="/subcontracts/new" variant="contained" sx={{ mb: 2 }}>New Subcontract</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vendor</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subs.map(s => (
            <TableRow key={s._id}>
              <TableCell>{s.vendor}</TableCell>
              <TableCell>{s.service}</TableCell>
              <TableCell>{s.amount}</TableCell>
              <TableCell>{s.status}</TableCell>
              <TableCell>{s.createdBy ? `${s.createdBy.name} (${s.createdBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default SubcontractList;
