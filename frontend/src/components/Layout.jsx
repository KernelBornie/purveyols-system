import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Menu, MenuItem, IconButton, Fab,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField,
  Tooltip, Menu as MuiMenu, ListItemIcon, ListItemText
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ReportModal from './ReportModal';
import api from '../api/axios';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

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

  const handleExportOpen = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const exportData = async (type) => {
    setExportLoading(true);
    try {
      let endpoint = '';
      let filename = '';
      let headers = [];
      let rows = [];
      if (type === 'workers') {
        const res = await api.get('/api/workers');
        const data = res.data;
        headers = ['Name', 'NRC', 'Phone', 'Site', 'Enrolled By', 'Balance'];
        rows = data.map(w => [w.name, w.nrc, w.phone, w.site, w.enrolledBy?.name || 'N/A', (w.balance || 0).toFixed(2)]);
        filename = 'workers_export.csv';
      } else if (type === 'projects') {
        const res = await api.get('/api/projects');
        const data = res.data;
        headers = ['Name', 'Location', 'Status', 'Budget', 'Manager'];
        rows = data.map(p => [p.name, p.location, p.status, p.budget, p.manager?.name || 'N/A']);
        filename = 'projects_export.csv';
      } else if (type === 'funding') {
        const res = await api.get('/api/funding-requests');
        const data = res.data;
        headers = ['Project', 'Amount', 'Status', 'Requested By', 'Date'];
        rows = data.map(f => [f.project?.name || 'N/A', f.amount, f.status, f.requestedBy?.name || 'N/A', new Date(f.requestedAt).toLocaleDateString()]);
        filename = 'funding_export.csv';
      } else {
        return;
      }
      // Build CSV
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
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
    } finally {
      setExportLoading(false);
      handleExportClose();
    }
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
            <Tooltip title="Export Data">
              <IconButton color="inherit" onClick={handleExportOpen}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <MuiMenu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={handleExportClose}>
              <MenuItem onClick={() => exportData('workers')} disabled={exportLoading}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export Workers</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => exportData('projects')} disabled={exportLoading}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export Projects</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => exportData('funding')} disabled={exportLoading}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export Funding Requests</ListItemText>
              </MenuItem>
            </MuiMenu>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleSettings}>Settings</MenuItem>
              <MenuItem onClick={handleReports}>
                <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Generate Report</ListItemText>
              </MenuItem>
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
