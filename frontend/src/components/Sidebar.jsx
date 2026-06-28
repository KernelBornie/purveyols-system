import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import ConstructionIcon from '@mui/icons-material/Construction';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import SurveyIcon from '@mui/icons-material/Map';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SafetyIcon from '@mui/icons-material/SafetyCheck';
import PaymentsIcon from '@mui/icons-material/Payments';
import HandymanIcon from '@mui/icons-material/Handyman';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle, isMobile }) => {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'AI Assistant', icon: <SmartToyIcon />, path: '/dashboard', state: { openAI: true } },
    { text: 'Projects', icon: <BusinessIcon />, path: '/projects' },
    { text: 'Workers', icon: <PeopleIcon />, path: '/workers' },
    { text: 'Visitors', icon: <PeopleAltIcon />, path: '/visitors' },
    { text: 'Tenders & RFQs', icon: <RequestQuoteIcon />, path: '/tenders' },
    { text: 'Funding Requests', icon: <AttachMoneyIcon />, path: '/funding' },
    { text: 'Procurement', icon: <ReceiptIcon />, path: '/procurement' },
    { text: 'Spare Parts', icon: <HandymanIcon />, path: '/spare-parts' },
    { text: 'BOQs', icon: <DescriptionIcon />, path: '/boq' },
    { text: 'Subcontracts', icon: <ConstructionIcon />, path: '/subcontracts' },
    { text: 'Advertised Projects', icon: <ConstructionIcon />, path: '/advertised-projects' },
    { text: 'Delivery Notes', icon: <LocalShippingIcon />, path: '/delivery' },
    { text: 'Site Plans', icon: <ArchitectureIcon />, path: '/site-plans' },
    { text: 'Drawings', icon: <DescriptionIcon />, path: '/drawings' },
    { text: 'Surveys', icon: <SurveyIcon />, path: '/surveys' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
    { text: 'Safety Reports', icon: <SafetyIcon />, path: '/safety-reports' },
    { text: 'Payment Notifications', icon: <PaymentsIcon />, path: '/payment-notifications' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const restrictedRoles = ['receptionist', 'safety', 'driver'];
  const hiddenItems = ['BOQs', 'Subcontracts', 'Site Plans', 'Drawings', 'Surveys'];

  const alwaysVisible = [
    'Dashboard',
    'Safety Reports',
    'Messages',
    'Profile',
    'Settings',
    'Spare Parts',
    'Visitors',
    'Tenders & RFQs',
  ];

  const visibleMenuItems = allMenuItems.filter(item => {
    if (alwaysVisible.includes(item.text)) return true;
    if (item.text === 'Payment Notifications') {
      return ['accountant', 'admin', 'director'].includes(role);
    }
    if (restrictedRoles.includes(role) && hiddenItems.includes(item.text)) {
      return false;
    }
    return true;
  });

  const drawerContent = (
    <Box>
      <Toolbar>
        <img
          src="/logo-branding.jpg"
          alt="PURVEYOLS"
          height={30}
          style={{ marginRight: 0, borderRadius: 4 }}
        />
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List dense={isMobile}>
          {visibleMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                state={item.state || null}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                  py: isMobile ? 0.5 : 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 30 : 40 }}>
                  {React.cloneElement(item.icon, { fontSize: isMobile ? 'small' : 'medium' })}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: isMobile ? '0.8rem' : 'inherit' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;