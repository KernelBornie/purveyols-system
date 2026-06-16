import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import api from '../api/axios';

const PaymentModal = ({ open, onClose, worker, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (worker) {
      const pending = worker.balance || 0;
      setAmount(pending > 0 ? pending.toString() : '');
    }
  }, [worker]);

  const handlePayPending = () => {
    if (worker) {
      const pending = worker.balance || 0;
      setAmount(pending > 0 ? pending.toString() : '');
    }
  };

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid amount' });
      return;
    }
    if (!pin || pin.length < 4) {
      setStatus({ type: 'error', message: 'Enter a 4-digit PIN' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        type: 'worker',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount: parseFloat(amount),
        worker: worker._id,
        notes: `Payment for ${worker.name}`,
      };
      const res = await api.post('/api/payments', payload);
      setStatus({ type: 'success', message: `Payment sent! Reference: ${res.data.reference}` });
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Payment failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pay Worker via Airtel Money</DialogTitle>
      <DialogContent>
        {worker && (
          <Box sx={{ mb: 2 }}>
            <Typography><strong>Worker:</strong> {worker.name}</Typography>
            <Typography><strong>Phone:</strong> {worker.phone}</Typography>
            <Typography><strong>NRC:</strong> {worker.nrc}</Typography>
            <Typography>
              <strong>Pending Balance:</strong> ZMW {(worker.balance || 0).toFixed(2)}
            </Typography>
          </Box>
        )}
        <TextField
          label="Amount (ZMW)"
          type="number"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Button variant="outlined" size="small" onClick={handlePayPending} sx={{ mt: 1 }}>
          Pay Pending Balance
        </Button>
        <TextField
          label="Airtel Money PIN (simulated)"
          type="password"
          fullWidth
          margin="normal"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter 4-digit PIN"
          required
        />
        {status && <Alert severity={status.type} sx={{ mt: 2 }}>{status.message}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handlePay} disabled={loading}>
            {loading ? 'Sending...' : 'Send Money'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
