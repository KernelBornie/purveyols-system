import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  Chip, IconButton, Tooltip, Box
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const ProcurementList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/api/procurement')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]));
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Material Requisition Notes
        </Typography>
        <Button 
          component={Link} 
          to="/procurement/new" 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          New Requisition
        </Button>
      </Box>
      
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Prepared By</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                  No requisition notes created yet. Click "New Requisition" to start.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            orders.map(o => (
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
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProcurementList;
