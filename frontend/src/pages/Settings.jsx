import React from 'react';
import { Paper, Typography, Box, Switch, FormControlLabel, Divider } from '@mui/material';

const Settings = () => {
  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Customize your experience (coming soon)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Notifications</Typography>
        <FormControlLabel control={<Switch defaultChecked />} label="Email notifications" />
        <FormControlLabel control={<Switch />} label="Push notifications" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Appearance</Typography>
        <FormControlLabel control={<Switch />} label="Dark mode (coming soon)" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Data</Typography>
        <Typography variant="body2" color="textSecondary">
          Export data and other options will be available soon.
        </Typography>
      </Box>
    </Paper>
  );
};

export default Settings;
