import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when the menu opens (optional)
    // You can uncomment this if you want to auto-mark on open
    // markAllAsRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    handleClose();
    if (notification.link) {
      navigate(notification.link);
    } else {
      // Fallback: try to construct a link from type
      const fallbackMap = {
        'payment_made': '/payments',
        'payment_failed': '/payments',
        'payment_confirmed': '/payments',
        'worker_enrolled': '/workers',
        'funding_approved': '/funding',
        'funding_requested': '/funding',
        'procurement_approved': '/procurement',
        'procurement_funded': '/procurement',
        'boq_shared': '/boq',
        'project_approved': '/projects',
        'project_rejected': '/projects',
      };
      const fallbackPath = fallbackMap[notification.type];
      if (fallbackPath) {
        navigate(fallbackPath);
      } else {
        navigate('/dashboard');
      }
    }
    // Mark as read after click
    markAsRead(notification._id);
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      worker_enrolled: 'New Worker',
      boq_shared: 'BOQ Shared',
      payment_made: 'Payment Made',
      payment_failed: 'Payment Failed',
      payment_confirmed: 'Payment Confirmed',
      funding_requested: 'Funding Requested',
      funding_approved: 'Funding Approved',
      procurement_ordered: 'Procurement Ordered',
      procurement_funded: 'Procurement Funded',
      procurement_approved: 'Procurement Approved',
      procurement_rejected: 'Procurement Rejected',
      subcontract_created: 'Subcontract Created',
      worker_checked_in: 'Worker Check-in',
      message_received: 'New Message',
      project_approved: 'Project Approved',
      project_rejected: 'Project Rejected',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      worker_enrolled: '#4caf50',
      payment_made: '#2196f3',
      payment_failed: '#f44336',
      payment_confirmed: '#4caf50',
      funding_approved: '#4caf50',
      procurement_approved: '#4caf50',
      project_approved: '#4caf50',
      project_rejected: '#f44336',
    };
    return colors[type] || '#ff9800';
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'auto',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary" sx={{ py: 2, width: '100%', textAlign: 'center' }}>
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              sx={{
                borderLeft: `4px solid ${n.read ? '#e0e0e0' : getTypeColor(n.type)}`,
                backgroundColor: n.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                py: 1.5,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 'normal' : 'bold' }}>
                    {n.title}
                  </Typography>
                  {!n.read && <CircleIcon sx={{ color: '#2196f3', fontSize: 10 }} />}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  {n.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Chip label={getTypeLabel(n.type)} size="small" variant="outlined" />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem onClick={() => { handleClose(); navigate('/notifications'); }} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">View all notifications</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;
