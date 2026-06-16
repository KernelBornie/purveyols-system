import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Alert } from '@mui/material';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestReset = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setToken(res.data.token);
      setMessage('Reset token generated (check console or use token below)');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      setMessage('Password reset successfully.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Forgot Password</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      {step === 1 && (
        <form onSubmit={requestReset}>
          <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Send Reset Token</Button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={resetPassword}>
          <TextField label="Reset Token" fullWidth margin="normal" value={token} onChange={e => setToken(e.target.value)} required />
          <TextField label="New Password" type="password" fullWidth margin="normal" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Reset Password</Button>
        </form>
      )}
      {step === 3 && (
        <Button component={Link} to="/login" variant="contained" sx={{ mt: 2 }}>Go to Login</Button>
      )}
    </Paper>
  );
};
export default ForgotPassword;
