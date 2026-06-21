import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Menu, MenuItem, IconButton, Fab,
  Tooltip, Menu as MuiMenu, ListItemIcon, ListItemText
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConstructionIcon from '@mui/icons-material/Construction';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ReportModal from './ReportModal';
import MessageDialog from './MessageDialog';
import AIAssistant from './AIAssistant';
import NetworkStatus from './NetworkStatus';
import api from '../api/axios';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // ─── Open AI from sidebar click ──────────────────────────────────
  useEffect(() => {
    if (location.state?.openAI) {
      setAiOpen(true);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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

  const handleAdvertisedProjects = () => {
    navigate('/advertised-projects');
    handleClose();
  };

  const handleDeliveryNotes = () => {
    navigate('/delivery');
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

  const handleBack = () => {
    if (location.pathname === '/dashboard') return;
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const showBack = location.pathname !== '/dashboard' && location.pathname !== '/login' && location.pathname !== '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {showBack && (
            <IconButton color="inherit" onClick={handleBack} edge="start" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img
              src="/logo-branding.jpg"
              alt="PURVEYOLS"
              height="40"
              style={{ marginRight: 12, borderRadius: 4 }}
            />
            <Typography
              variant="h6"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/dashboard')}
            >
              PURVEYOLS CMS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NetworkStatus />
            <NotificationBell />
            <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Tooltip title="AI Assistant">
              <IconButton color="inherit" onClick={() => setAiOpen(true)}>
                <SmartToyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Advertised Projects & Tenders">
              <IconButton color="inherit" onClick={() => navigate('/advertised-projects')}>
                <ConstructionIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delivery Notes">
              <IconButton color="inherit" onClick={() => navigate('/delivery')}>
                <LocalShippingIcon />
              </IconButton>
            </Tooltip>
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
              <MenuItem onClick={handleAdvertisedProjects}>
                <ListItemIcon><ConstructionIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Advertised Projects</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDeliveryNotes}>
                <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Delivery Notes</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleReports}>
                <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Generate Report</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Box className="dashboard-content">
            <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
              <Outlet />
            </Container>
          </Box>
        </Box>
      </Box>
      <Footer />
      <Fab color="primary" aria-label="message" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={handleMsgOpen}>
        <MessageIcon />
      </Fab>
      <Fab color="secondary" aria-label="ai" sx={{ position: 'fixed', bottom: 90, right: 24 }} onClick={() => setAiOpen(true)}>
        <SmartToyIcon />
      </Fab>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <MessageDialog open={msgOpen} onClose={handleMsgClose} onSent={() => {}} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </Box>
  );
};

export default Layout;
