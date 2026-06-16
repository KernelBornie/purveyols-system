import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography, Alert
} from '@mui/material';
import api from '../api/axios';

const PaymentModal = ({ open, onClose, worker, project }) => {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handlePay = async () => {
    if (!amount || !pin) {
      setStatus({ type: 'error', message: 'Please fill all fields' });
      return;
    }
    if (pin.length < 4) {
      setStatus({ type: 'error', message: 'PIN must be at least 4 digits' });
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
        project: project?._id || null,
        notes: `Payment for ${worker.name}`,
      };
      const res = await api.post('/api/payments', payload);
      setStatus({ type: 'success', message: `Payment sent! Reference: ${res.data.reference}` });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
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
