import React from 'react';
import { Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Use replace to remove the current page from history
    navigate('/login', { replace: true });
  };

  return (
    <Button color="inherit" onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
