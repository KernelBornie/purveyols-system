import React, { useState, useEffect } from 'react';
import {
  IconButton, Badge, Popover, List, ListItem, ListItemText, Typography,
  Box, Divider, Chip, Button, CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
    // Mark all as read when opened? We'll let user click to mark individually.
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, maxHeight: 450 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
            )}
          </Box>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />
          ) : notifications.length === 0 ? (
            <Typography color="textSecondary" align="center">No notifications</Typography>
          ) : (
            <List dense sx={{ overflow: 'auto', maxHeight: 350 }}>
              {notifications.map((n) => (
                <ListItem
                  key={n._id}
                  sx={{
                    bgcolor: n.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 0.5
                  }}
                  component={Link}
                  to={n.link || '#'}
                  onClick={() => { if (!n.read) handleMarkRead(n._id); handleClose(); }}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={n.message}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {!n.read && <Chip label="New" size="small" color="primary" />}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
