import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container, Menu, MenuItem, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

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

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            PURVEYOLS CMS
          </Typography>
          <Box>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/change-password')}>Change Password</Button>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleSettings}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
};

export default Layout;
