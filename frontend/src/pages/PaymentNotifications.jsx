import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BackButton from '../components/BackButton';

const PaymentNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Role check ──────────────────────────────────────────
  const isAuthorized = user?.role === 'accountant' || user?.role === 'admin' || user?.role === 'director';
  if (!isAuthorized) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You are not authorized to view this page.</Alert>
      </Box>
    );
  }

  // ─── Fetch payment notifications ────────────────────────
  const fetchPaymentNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/notifications');
      const paymentTypes = ['payment_made', 'payment_failed', 'payment_confirmed'];
      const all = res.data || [];
      const payments = all.filter(n => paymentTypes.includes(n.type));
      payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(payments);
      setFiltered(payments);
    } catch (err) {
      setError(err.message || 'Failed to load payment notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentNotifications();
  }, [fetchPaymentNotifications]);

  // ─── Filter handler ──────────────────────────────────────
  useEffect(() => {
    if (filter === 'all') {
      setFiltered(notifications);
    } else if (filter === 'success') {
      setFiltered(notifications.filter(n => n.type === 'payment_made' || n.type === 'payment_confirmed'));
    } else if (filter === 'failed') {
      setFiltered(notifications.filter(n => n.type === 'payment_failed'));
    }
  }, [filter, notifications]);

  // ─── Mark as read ──────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // ─── Format date ──────────────────────────────────────────
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Get status chip ─────────────────────────────────────
  const getStatusChip = (type) => {
    if (type === 'payment_made' || type === 'payment_confirmed') {
      return <Chip label="Success" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else if (type === 'payment_failed') {
      return <Chip label="Failed" color="error" size="small" icon={<ErrorIcon />} />;
    }
    return <Chip label="Unknown" size="small" />;
  };

  // ─── Extract amount from message ─────────────────────────
  const extractAmount = (message) => {
    const match = message.match(/ZMW\s*([\d,.]+)/);
    return match ? `ZMW ${match[1]}` : 'N/A';
  };

  // ─── Extract recipient from message ──────────────────────
  const extractRecipient = (message) => {
    const match = message.match(/paid\s+(.+?)\s+ZMW/);
    return match ? match[1] : 'Unknown';
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <BackButton />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          <PaymentsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Payment Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchPaymentNotifications} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No payment notifications found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n) => (
                  <TableRow
                    key={n._id}
                    sx={{
                      backgroundColor: n.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                    }}
                  >
                    <TableCell>{formatDate(n.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={n.type.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{n.message}</TableCell>
                    <TableCell>{extractAmount(n.message)}</TableCell>
                    <TableCell>{extractRecipient(n.message)}</TableCell>
                    <TableCell>{getStatusChip(n.type)}</TableCell>
                    <TableCell align="center">
                      {!n.read && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => markAsRead(n._id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      {n.read && (
                        <Typography variant="caption" color="textSecondary">
                          Read
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PaymentNotifications;
