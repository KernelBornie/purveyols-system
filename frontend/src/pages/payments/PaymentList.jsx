import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Tooltip, CircularProgress, Alert, Button,
  TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBulkOnly, setShowBulkOnly] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/payments');
      setPayments(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (showBulkOnly && p.notes !== 'Bulk payment') return false;
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const formatDate = (date) => new Date(date).toLocaleString();

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">All Payments</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPayments}>
          Refresh
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select value={filterType} label="Type" onChange={e => setFilterType(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="worker">Worker</MenuItem>
            <MenuItem value="funding">Funding</MenuItem>
            <MenuItem value="procurement">Procurement</MenuItem>
            <MenuItem value="subcontract">Subcontract</MenuItem>
            <MenuItem value="bulk">Bulk</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant={showBulkOnly ? 'contained' : 'outlined'}
          onClick={() => setShowBulkOnly(!showBulkOnly)}
        >
          {showBulkOnly ? 'Showing Bulk Only' : 'Show Bulk Only'}
        </Button>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Type</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPayments.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.type}</TableCell>
              <TableCell>{p.recipientName}</TableCell>
              <TableCell>{p.recipientPhone}</TableCell>
              <TableCell>{formatCurrency(p.amount)}</TableCell>
              <TableCell>
                <Chip label={p.status} color={getStatusColor(p.status)} size="small" />
              </TableCell>
              <TableCell>{formatDate(p.paidAt)}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton component={Link} to={`/payments/${p._id}`} size="small" color="info">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {filteredPayments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">No payments found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default PaymentList;