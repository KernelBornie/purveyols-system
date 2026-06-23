import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BackButton from '../components/BackButton';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const isAuthorized = ['accountant', 'admin', 'director'].includes(user?.role);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await api.get(`/api/payments/${id}`);
        setPayment(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPayment();
  }, [id]);

  const handleMarkAsFailed = async () => {
    if (!window.confirm('Mark this payment as failed?')) return;
    setUpdating(true);
    try {
      await api.put(`/api/payments/${id}/fail`);
      const updated = await api.get(`/api/payments/${id}`);
      setPayment(updated.data);
      alert('Payment marked as failed');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update payment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  if (!payment) return <Alert severity="info" sx={{ m: 2 }}>Payment not found.</Alert>;

  const statusColor = {
    completed: 'success',
    pending: 'warning',
    failed: 'error',
  }[payment.status];

  const statusIcon = {
    completed: <CheckCircleIcon />,
    pending: <PendingIcon />,
    failed: <ErrorIcon />,
  }[payment.status];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <BackButton />
      <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Payment Details</Typography>
          <Chip
            icon={statusIcon}
            label={payment.status.toUpperCase()}
            color={statusColor}
            variant="filled"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Reference</Typography>
            <Typography variant="body1">{payment.reference || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Type</Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {payment.type || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Recipient</Typography>
            <Typography variant="body1">{payment.recipientName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
            <Typography variant="body1">{payment.recipientPhone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Amount</Typography>
            <Typography variant="h4" color="primary">ZMW {payment.amount?.toFixed(2) || '0.00'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Paid By</Typography>
            <Typography variant="body1">{payment.paidBy?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Paid At</Typography>
            <Typography variant="body1">
              {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Project</Typography>
            <Typography variant="body1">{payment.project?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
            <Typography variant="body1">{payment.notes || 'None'}</Typography>
          </Grid>
        </Grid>

        {isAuthorized && payment.status !== 'failed' && (
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleMarkAsFailed}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Mark as Failed'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PaymentDetails;
