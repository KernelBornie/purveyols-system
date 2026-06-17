import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Switch, FormControlLabel, Divider, Button,
  Alert, CircularProgress, Tabs, Tab, Card, CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
  });
  const [message, setMessage] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    api.get('/api/users/settings')
      .then(res => {
        setSettings({
          emailNotifications: res.data.emailNotifications !== undefined ? res.data.emailNotifications : true,
          pushNotifications: res.data.pushNotifications !== undefined ? res.data.pushNotifications : true,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      await api.put('/api/users/settings', newSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const exportData = async (type) => {
    try {
      const res = await api.get(`/api/${type}`);
      const data = res.data;
      const filename = `${type}_export.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Preferences" />
        <Tab label="Notifications" />
        <Tab label="Appearance" />
        <Tab label="Data" />
        <Tab label="Security" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Typography variant="h6">General Preferences</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary">
            Customize your experience. Changes are saved automatically.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleToggle('emailNotifications', e.target.checked)}
                  disabled={saving}
                />
              }
              label="Email notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleToggle('pushNotifications', e.target.checked)}
                  disabled={saving}
                />
              }
              label="Push notifications"
            />
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6">Notification Settings</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleToggle('emailNotifications', e.target.checked)}
                  disabled={saving}
                />
              }
              label="Receive email notifications for messages and updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleToggle('pushNotifications', e.target.checked)}
                  disabled={saving}
                />
              }
              label="Receive push notifications (in-app alerts)"
            />
            <Typography variant="caption" color="textSecondary">
              Notifications include: new messages, funding approvals, payments, worker enrollments, and more.
            </Typography>
          </Box>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6">Appearance</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1">Dark Mode</Typography>
              <Typography variant="caption" color="textSecondary">
                Switch to a darker theme for reduced eye strain
              </Typography>
            </Box>
            <Switch checked={darkMode} onChange={toggleDarkMode} />
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2">
              {darkMode ? '🌙 Dark mode is enabled' : '☀️ Light mode is enabled'}
            </Typography>
          </Box>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h6">Data Export</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Export your data in JSON format for backup or analysis.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" onClick={() => exportData('workers')}>Export Workers</Button>
            <Button variant="outlined" onClick={() => exportData('projects')}>Export Projects</Button>
            <Button variant="outlined" onClick={() => exportData('funding-requests')}>Export Funding</Button>
            <Button variant="outlined" onClick={() => exportData('payments')}>Export Payments</Button>
            <Button variant="outlined" onClick={() => exportData('procurement')}>Export Procurement</Button>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            All exports are downloaded as JSON files.
          </Typography>
        </Box>
      )}

      {tabValue === 4 && (
        <Box>
          <Typography variant="h6">Security</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Manage your password and account security.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/profile')}>
            Change Password
          </Button>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            You will be redirected to your profile page to change your password.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default Settings;
