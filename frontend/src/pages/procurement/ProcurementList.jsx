import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  Chip, IconButton, Tooltip, Box
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const ProcurementList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/api/procurement').then(res => setOrders(res.data));
  }, []);

  const getItemSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    const names = items.map(i => i.name).filter(Boolean);
    if (names.length === 0) return `${items.length} item(s)`;
    return names.slice(0, 3).join(', ') + (names.length > 3 ? '...' : '');
  };

  const getGrandTotal = (items) => {
    return items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Typography variant="h5" gutterBottom>Procurement Orders</Typography>
      <Button component={Link} to="/procurement/new" variant="contained" sx={{ mb: 2 }}>
        New Order (blank amounts)
      </Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map(o => (
            <TableRow key={o._id}>
              <TableCell>{o.project?.name || 'N/A'}</TableCell>
              <TableCell>
                <Tooltip title={o.items?.map(i => `${i.name} (${i.quantity})`).join(', ') || 'No items'}>
                  <span>{getItemSummary(o.items)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>{getGrandTotal(o.items).toFixed(2)}</TableCell>
              <TableCell>
                <Chip
                  label={o.status}
                  color={o.status === 'funded' ? 'success' : o.status === 'purchased' ? 'info' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell>{o.createdBy?.name || 'N/A'}</TableCell>
              <TableCell>
                <IconButton
                  component={Link}
                  to={`/procurement/${o._id}`}
                  size="small"
                  color="primary"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ProcurementList;
