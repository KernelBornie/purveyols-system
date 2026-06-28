import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Menu, MenuItem, IconButton, Fab,
  Tooltip, Menu as MuiMenu, ListItemIcon, ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConstructionIcon from '@mui/icons-material/Construction';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ReportModal from './ReportModal';
import MessageDialog from './MessageDialog';
import AIAssistant from './AIAssistant';
import NetworkStatus from './NetworkStatus';
import api from '../api/axios';
import Footer from './Footer';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openAI) {
      setAiOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          {!isMobile && showBack && (
            <IconButton color="inherit" onClick={handleBack} edge="start" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src="/logo-branding.jpg"
              alt="PURVEYOLS"
              height={isMobile ? 28 : 40}
              style={{ marginRight: 8, borderRadius: 4 }}
            />
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              sx={{ cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
              onClick={() => navigate('/dashboard')}
            >
              {isMobile ? 'PURVEYOLS' : 'PURVEYOLS CMS'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: isMobile ? 0.5 : 1, flexShrink: 0 }}>
            <NetworkStatus />
            <NotificationBell />
            {!isMobile && (
              <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                Dashboard
              </Button>
            )}
            <Tooltip title="Advertised Projects & Tenders">
              <IconButton color="inherit" onClick={() => navigate('/advertised-projects')} size={isMobile ? 'small' : 'medium'}>
                <ConstructionIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delivery Notes">
              <IconButton color="inherit" onClick={() => navigate('/delivery')} size={isMobile ? 'small' : 'medium'}>
                <LocalShippingIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Data">
              <IconButton color="inherit" onClick={handleExportOpen} size={isMobile ? 'small' : 'medium'}>
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
            <IconButton color="inherit" onClick={handleMenu} size={isMobile ? 'small' : 'medium'}>
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

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          isMobile={isMobile}
        />
        <Box
          component="main"
          className="dashboard-content"   // ← Applied here
          sx={{
            flexGrow: 1,
            p: isMobile ? 1 : 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 64px)',
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
            <Outlet />
          </Container>
        </Box>
      </Box>

      <Footer />

      <Tooltip title="AI Assistant">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 100 }}
          size={isMobile ? 'small' : 'medium'}
          onClick={() => setAiOpen(true)}
        >
          <SmartToyIcon />
        </Fab>
      </Tooltip>

      <Fab
        color="secondary"
        aria-label="message"
        sx={{ position: 'fixed', bottom: isMobile ? 24 : 24, right: isMobile ? 16 : 24 }}
        size={isMobile ? 'small' : 'medium'}
        onClick={handleMsgOpen}
      >
        <MessageIcon />
      </Fab>

      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <MessageDialog open={msgOpen} onClose={handleMsgClose} onSent={() => {}} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </Box>
  );
};

export default Layout;