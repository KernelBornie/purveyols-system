import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Fade
} from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PhoneSimulator = ({ open, onClose, onConfirm, reference, amount, recipientPhone, workerName }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmed(false);
    }
  }, [open]);

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // PIN entry complete
      setLoading(true);
      setTimeout(() => {
        setConfirmed(true);
        setLoading(false);
      }, 1500);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    setConfirmed(false);
    onClose();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneAndroidIcon color="primary" />
          <Typography variant="h6">Airtel Money USSD</Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <SignalCellularAltIcon fontSize="small" />
            <BatteryFullIcon fontSize="small" />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 3, bgcolor: '#000', color: '#fff', minHeight: 350, borderRadius: 2 }}>
          <Fade in={true} timeout={500}>
            <Box>
              {step === 1 && (
                <Box>
                  <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace' }}>
                    *182# - Airtel Money
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      <strong>1.</strong> Send Money
                    </Typography>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      <strong>2.</strong> Airtel Money Balance
                    </Typography>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      <strong>3.</strong> Pay Bill
                    </Typography>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      <strong>4.</strong> Buy Airtime
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3, borderTop: '1px solid #333', pt: 2 }}>
                    <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace' }}>
                      Enter option:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                        onClick={handleNextStep}
                      >
                        1
                      </Button>
                      <Button variant="outlined" size="small" sx={{ color: '#fff', borderColor: '#555' }}>
                        2
                      </Button>
                      <Button variant="outlined" size="small" sx={{ color: '#fff', borderColor: '#555' }}>
                        3
                      </Button>
                      <Button variant="outlined" size="small" sx={{ color: '#fff', borderColor: '#555' }}>
                        4
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {step === 2 && (
                <Box>
                  <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace' }}>
                    *182# - Airtel Money
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      Enter Recipient:
                    </Typography>
                    <Typography variant="body2" color="#ff9800" sx={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                      {recipientPhone}
                    </Typography>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace', mt: 2 }}>
                      Amount (ZMW):
                    </Typography>
                    <Typography variant="body2" color="#ff9800" sx={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                      {amount}
                    </Typography>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace', mt: 2 }}>
                      Reference:
                    </Typography>
                    <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {reference}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3, borderTop: '1px solid #333', pt: 2 }}>
                    <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace' }}>
                      Press 1 to Confirm
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                      onClick={handleNextStep}
                    >
                      1 - Confirm
                    </Button>
                  </Box>
                </Box>
              )}

              {step === 3 && (
                <Box>
                  <Typography variant="body2" color="#4caf50" sx={{ fontFamily: 'monospace' }}>
                    *182# - Airtel Money
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="#fff" sx={{ fontFamily: 'monospace' }}>
                      Enter your PIN:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                      {[1, 2, 3, 4].map((num) => (
                        <Box
                          key={num}
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: '#333',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: '#fff',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#555' }
                          }}
                          onClick={() => {
                            // PIN entry simulated
                            if (num === 4) handleNextStep();
                          }}
                        >
                          ••{num === 4 ? '4' : ''}
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" color="#666" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                      {loading ? 'Processing...' : 'Enter your 4-digit PIN'}
                    </Typography>
                    {loading && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={30} sx={{ color: '#4caf50' }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {confirmed && (
                <Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50' }} />
                    <Typography variant="h6" sx={{ color: '#4caf50', mt: 2 }}>
                      Payment Confirmed!
                    </Typography>
                    <Typography variant="body2" color="#aaa" sx={{ mt: 1 }}>
                      ZMW {amount} sent to {workerName || 'Worker'}
                    </Typography>
                    <Typography variant="caption" color="#666" sx={{ mt: 2 }}>
                      Reference: {reference}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 3, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                      onClick={handleConfirm}
                    >
                      ✓ Done
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneSimulator;
