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
  Typography,
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
import StraightenIcon from '@mui/icons-material/Straighten';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Projects', icon: <BusinessIcon />, path: '/projects' },
    { text: 'Workers', icon: <PeopleIcon />, path: '/workers' },
    { text: 'Funding Requests', icon: <AttachMoneyIcon />, path: '/funding' },
    { text: 'Procurement', icon: <ReceiptIcon />, path: '/procurement' },
    { text: 'BOQs', icon: <DescriptionIcon />, path: '/boq' },
    { text: 'Subcontracts', icon: <ConstructionIcon />, path: '/subcontracts' },
    { text: 'Advertised Projects', icon: <ConstructionIcon />, path: '/advertised-projects' },
    { text: 'Delivery Notes', icon: <LocalShippingIcon />, path: '/delivery' },
    // NEW SITE PLANS & SURVEYING
    { text: 'Site Plans', icon: <ArchitectureIcon />, path: '/site-plans' },
    { text: 'Surveying', icon: <StraightenIcon />, path: '/site-plans' },
    // NEW DRAWINGS
    { text: 'Drawings', icon: <DescriptionIcon />, path: '/drawings' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <img
          src="/logo-branding.jpg"
          alt="PURVEYOLS"
          height="30"
          style={{ marginRight: 0, borderRadius: 4 }}
        />
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
