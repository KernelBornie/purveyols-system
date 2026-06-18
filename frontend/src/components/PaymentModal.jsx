import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import api from '../api/axios';

const PaymentModal = ({ open, onClose, worker, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState(0);
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (worker) {
      const pending = worker.balance || 0;
      setAmount(pending > 0 ? pending.toString() : '');
      if (worker.phone) setRecipientPhone(worker.phone);
    }
    setStep(0);
    setStatus(null);
    setReference('');
    setConfirmed(false);
  }, [worker, open]);

  const handlePayPending = () => {
    if (worker) {
      const pending = worker.balance || 0;
      setAmount(pending > 0 ? pending.toString() : '');
    }
  };

  const handleInitiate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid amount' });
      return;
    }
    if (!recipientPhone || recipientPhone.length < 10) {
      setStatus({ type: 'error', message: 'Enter a valid recipient phone number' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        recipientPhone,
        amount: parseFloat(amount),
        workerId: worker?._id || null,
        note: `Payment for ${worker?.name || 'worker'}`
      };
      const res = await api.post('/api/mobile-money/initiate', payload);
      setReference(res.data.reference);
      setStatus({ 
        type: 'success', 
        message: res.data.payment.status === 'completed' 
          ? `✅ Payment sent successfully! Reference: ${res.data.reference}` 
          : `📱 Payment initiated. Check your phone for USSD prompt.` 
      });
      setStep(1);
      if (res.data.payment.status === 'completed') {
        setConfirmed(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Initiation failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/api/mobile-money/confirm', { reference });
      setStatus({ 
        type: 'success', 
        message: `✅ Payment confirmed! Reference: ${res.data.reference}` 
      });
      setConfirmed(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Confirmation failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pay Worker via Airtel Money</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ my: 2 }}>
          <Step><StepLabel>Initiate</StepLabel></Step>
          <Step><StepLabel>Confirm</StepLabel></Step>
        </Stepper>

        {worker && step === 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography><strong>Worker:</strong> {worker.name}</Typography>
            <Typography><strong>Phone:</strong> {worker.phone}</Typography>
            <Typography><strong>NRC:</strong> {worker.nrc}</Typography>
            <Typography><strong>Pending Balance:</strong> ZMW {(worker.balance || 0).toFixed(2)}</Typography>
          </Box>
        )}

        {step === 0 && (
          <>
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
              label="Recipient Phone Number"
              fullWidth
              margin="normal"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g., 0971234567"
              required
            />
            {status && <Alert severity={status.type} sx={{ mt: 2 }}>{status.message}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="contained" onClick={handleInitiate} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Send Money'}
              </Button>
            </Box>
          </>
        )}

        {step === 1 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {confirmed ? '✅ Payment Completed' : '📱 Airtel Money Processing'}
              </Typography>
              <Typography variant="body2">
                {confirmed 
                  ? 'Payment has been sent successfully!' 
                  : 'Please check your phone for the Airtel Money USSD prompt or wait for processing.'}
              </Typography>
            </Alert>
            <Typography variant="body2" color="textSecondary">
              Reference: <strong>{reference}</strong>
            </Typography>
            {status && <Alert severity={status.type} sx={{ mt: 2 }}>{status.message}</Alert>}
            {!confirmed && (
              <Button 
                variant="contained" 
                color="success"
                onClick={handleConfirm}
                disabled={loading}
                fullWidth
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'I Have Confirmed on Phone'}
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
