import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Menu, MenuItem, IconButton, Fab,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MessageIcon from '@mui/icons-material/Message';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ReportModal from './ReportModal';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [msgText, setMsgText] = useState('');

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleReports = () => {
    setReportOpen(true);
    handleClose();
  };

  const handleMsgOpen = () => setMsgOpen(true);
  const handleMsgClose = () => setMsgOpen(false);

  const handleSendMessage = () => {
    const phone = '+260971234567';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msgText || 'Hello from Purveyols CMS!')}`;
    window.open(url, '_blank');
    setMsgOpen(false);
    setMsgText('');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            PURVEYOLS CMS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationBell />
            <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/change-password')}>Change Password</Button>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleSettings}>Settings</MenuItem>
              <MenuItem onClick={handleReports}>Reports</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>

      <Fab color="primary" aria-label="message" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={handleMsgOpen}>
        <MessageIcon />
      </Fab>

      <Dialog open={msgOpen} onClose={handleMsgClose} fullWidth maxWidth="sm">
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <DialogContentText>Send a message to our support team via WhatsApp.</DialogContentText>
          <TextField autoFocus margin="dense" label="Your Message" type="text" fullWidth multiline rows={4} value={msgText} onChange={(e) => setMsgText(e.target.value)} variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMsgClose}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained">Send via WhatsApp</Button>
        </DialogActions>
      </Dialog>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
};

export default Layout;
