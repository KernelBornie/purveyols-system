import React, { useState, useEffect } from 'react';
import {
  IconButton, Badge, Popover, List, ListItem, ListItemText, Typography,
  Box, Divider, Chip, Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [pending, setPending] = useState({ total: 0, pendingFunding: 0, pendingBOQs: 0, pendingProcurement: 0 });
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/reports/accountant/pending-count');
      setPending(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); const interval = setInterval(fetchPending, 30000); return () => clearInterval(interval); }, []);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={pending.total} color="error" max={99}>
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
        PaperProps={{ sx: { width: 350, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Pending Actions</Typography>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <List dense>
              {pending.pendingFunding > 0 && (
                <ListItem component={Link} to="/funding">
                  <ListItemText primary={`${pending.pendingFunding} Funding Requests`} />
                  <Chip label="Approve" size="small" color="warning" />
                </ListItem>
              )}
              {pending.pendingBOQs > 0 && (
                <ListItem component={Link} to="/boq">
                  <ListItemText primary={`${pending.pendingBOQs} BOQs`} />
                  <Chip label="Review" size="small" color="warning" />
                </ListItem>
              )}
              {pending.pendingProcurement > 0 && (
                <ListItem component={Link} to="/procurement">
                  <ListItemText primary={`${pending.pendingProcurement} Procurement Orders`} />
                  <Chip label="Fund" size="small" color="warning" />
                </ListItem>
              )}
              {pending.total === 0 && <Typography color="textSecondary">All caught up! 🎉</Typography>}
            </List>
          )}
          <Button size="small" onClick={handleClose} sx={{ mt: 1 }}>Close</Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
