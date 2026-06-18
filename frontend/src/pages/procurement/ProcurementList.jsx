import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  Chip, IconButton, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const ProcurementList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/api/procurement').then(res => setOrders(res.data));
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      funded: 'info',
      purchased: 'success',
      delivered: 'primary'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Typography variant="h5" gutterBottom>Material Requisition Notes</Typography>
      <Button component={Link} to="/procurement/new" variant="contained" sx={{ mb: 2 }}>
        Create Requisition
      </Button>
      
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Order No.</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Prepared By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map(o => (
            <TableRow key={o._id}>
              <TableCell sx={{ fontWeight: 'bold' }}>{o.orderNumber}</TableCell>
              <TableCell>{o.project?.name}</TableCell>
              <TableCell>{o.items?.length || 0}</TableCell>
              <TableCell>{formatCurrency(o.grandTotal)}</TableCell>
              <TableCell>
                <Chip label={o.status} size="small" color={getStatusColor(o.status)} />
              </TableCell>
              <TableCell>{o.preparedBy || o.createdBy?.name}</TableCell>
              <TableCell>
                <Tooltip title="View/Edit">
                  <IconButton component={Link} to={`/procurement/${o._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton size="small" onClick={() => window.print()}>
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProcurementList;
