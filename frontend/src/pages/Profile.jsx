import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Paper, Typography, TextField, Button, Box, Alert, Grid, Divider, Chip } from '@mui/material';
import api from '../api/axios';
import BackButton from '../components/BackButton';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', nrc: '', mobileMoneyNumber: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);

  const isAccountant = user?.role === 'accountant';

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        nrc: user.nrc || '',
        mobileMoneyNumber: user.mobileMoneyNumber || '',
      });
      setTrackingInfo({
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.role,
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.put('/api/users/profile', form);
      setMessage('Profile updated successfully');
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h4" gutterBottom>Edit Profile</Typography>
      
      {/* Tracking Info */}
      {trackingInfo && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            <Chip label={trackingInfo.role} size="small" color="primary" sx={{ mr: 1 }} />
            {trackingInfo.createdAt && (
              <span>Joined: {new Date(trackingInfo.createdAt).toLocaleDateString()} | </span>
            )}
            {trackingInfo.lastLogin && (
              <span>Last Login: {new Date(trackingInfo.lastLogin).toLocaleString()}</span>
            )}
          </Typography>
        </Box>
      )}

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleProfileUpdate}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" fullWidth margin="normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone" fullWidth margin="normal" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="NRC" fullWidth margin="normal" value={form.nrc || ''} onChange={(e) => setForm({ ...form, nrc: e.target.value })} />
          </Grid>
          {/* Mobile Money Number – ONLY for Accountant */}
          {isAccountant && (
            <Grid item xs={12}>
              <TextField
                label="Mobile Money Number (Airtel Money)"
                fullWidth
                margin="normal"
                value={form.mobileMoneyNumber || ''}
                onChange={(e) => setForm({ ...form, mobileMoneyNumber: e.target.value })}
                placeholder="e.g., 0971234567"
                helperText="Used for mobile money payments (accountant only)"
              />
            </Grid>
          )}
          {!isAccountant && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'action.disabledBackground', borderRadius: 1, mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Mobile Money Number is only available for Accountant role.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
        <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Saving...' : 'Update Profile'}
        </Button>
      </form>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>Change Password</Typography>
      <form onSubmit={handlePasswordChange}>
        <TextField label="Current Password" type="password" fullWidth margin="normal" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
        <TextField label="New Password" type="password" fullWidth margin="normal" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
        <TextField label="Confirm New Password" type="password" fullWidth margin="normal" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
        <Button type="submit" variant="outlined" sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </form>
    </Paper>
  );
};

export default Profile;
