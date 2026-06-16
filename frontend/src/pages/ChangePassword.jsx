import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Alert } from '@mui/material';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess('Password changed successfully');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5">Change Password</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField label="Current Password" type="password" fullWidth margin="normal" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} required />
        <TextField label="New Password" type="password" fullWidth margin="normal" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} required />
        <TextField label="Confirm Password" type="password" fullWidth margin="normal" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Change Password</Button>
      </form>
    </Paper>
  );
};
export default ChangePassword;
