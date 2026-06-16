import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography, Chip } from '@mui/material';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const ProcurementList = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/api/procurement').then(res => setOrders(res.data));
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5">Procurement Orders</Typography>
      <Button component={Link} to="/procurement/new" variant="contained" sx={{ mb: 2 }}>New Order (blank amounts)</Button>
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
          {orders.map(o => (
            <TableRow key={o._id}>
              <TableCell>{o.project?.name}</TableCell>
              <TableCell>{o.items?.length || 0}</TableCell>
              <TableCell><Chip label={o.status} color={o.status==='funded'?'success':'default'} /></TableCell>
              <TableCell>{o.createdBy ? `${o.createdBy.name} (${o.createdBy.role})` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
export default ProcurementList;
