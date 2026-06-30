import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Tooltip, Alert, CircularProgress, Button, Tabs, Tab
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { getStore } from '../../services/persistentStore';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchNotifications = async (useCache = true, pageNum = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=${limit}`);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setError(null);
    } catch (err) {
      if (useCache) {
        try {
          const cached = await getStore('notifications');
          if (cached && cached.length > 0) {
            setNotifications(cached);
            setError('Showing cached notifications – server unavailable. Tap Retry to refresh.');
            return;
          }
        } catch (_) { /* ignore */ }
      }
      setError('Failed to load notifications. Please try again.');
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true, 1);
  }, []);

  const handleRetry = () => {
    fetchNotifications(false, page);
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications(false, page);
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications(false, page);
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/api/notifications/${id}`);
      fetchNotifications(false, page);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL notifications? This cannot be undone.')) return;
    try {
      await api.delete('/api/notifications');
      fetchNotifications(false, page);
    } catch (err) {
      alert('Failed to delete all notifications');
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      worker_enrolled: 'New Worker',
      boq_shared: 'BOQ',
      payment_made: 'Payment Made',
      payment_failed: 'Payment Failed',
      payment_confirmed: 'Payment Confirmed',
      funding_requested: 'Funding Requested',
      funding_approved: 'Funding Approved',
      funding_rejected: 'Funding Rejected',
      funding_funded: 'Funding Released',
      funding_forwarded: 'Funding Forwarded',
      procurement_ordered: 'Procurement Ordered',
      procurement_funded: 'Procurement Funded',
      procurement_approved: 'Procurement Approved',
      procurement_rejected: 'Procurement Rejected',
      subcontract_created: 'Subcontract Created',
      subcontract_approved: 'Subcontract Approved',
      subcontract_funded: 'Subcontract Funded',
      worker_checked_in: 'Worker Check-in',
      message_received: 'New Message',
      project_approved: 'Project Approved',
      project_rejected: 'Project Rejected',
      project_created: 'Project Created',
      safety_report_created: 'Safety Report',
      visitor_logged: 'Visitor Logged',
      logbook_entry: 'Logbook Entry',
      spare_part_requested: 'Spare Part Requested',
      spare_part_approved: 'Spare Part Approved',
      spare_part_rejected: 'Spare Part Rejected',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      worker_enrolled: '#4caf50',
      boq_shared: '#2196f3',
      payment_made: '#4caf50',
      payment_failed: '#f44336',
      payment_confirmed: '#4caf50',
      funding_requested: '#ff9800',
      funding_approved: '#4caf50',
      funding_rejected: '#f44336',
      funding_funded: '#00bcd4',
      funding_forwarded: '#9c27b0',
      procurement_ordered: '#2196f3',
      procurement_funded: '#4caf50',
      procurement_approved: '#4caf50',
      procurement_rejected: '#f44336',
      subcontract_created: '#3f51b5',
      subcontract_approved: '#4caf50',
      subcontract_funded: '#00bcd4',
      worker_checked_in: '#4caf50',
      message_received: '#9c27b0',
      project_approved: '#4caf50',
      project_rejected: '#f44336',
      project_created: '#2196f3',
      safety_report_created: '#ff9800',
      visitor_logged: '#9c27b0',
      logbook_entry: '#00bcd4',
      spare_part_requested: '#ff6f00',
      spare_part_approved: '#4caf50',
      spare_part_rejected: '#f44336',
    };
    return colors[type] || '#ff9800';
  };

  const filteredNotifications = tab === 0 ? notifications : tab === 1 ? notifications.filter(n => n.read) : notifications.filter(n => !n.read);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchNotifications(false, newPage);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">Notifications</Typography>
        <Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetry} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={handleMarkAllRead} sx={{ mr: 1 }}>
            Mark All Read
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
          >
            Delete All
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 2 }}>
        <Tab label={`All (${notifications.length})`} />
        <Tab label={`Read (${notifications.filter(n => n.read).length})`} />
        <Tab label={`Unread (${notifications.filter(n => !n.read).length})`} />
      </Tabs>

      {loading ? (
        <CircularProgress />
      ) : filteredNotifications.length === 0 ? (
        <Typography align="center" color="textSecondary" sx={{ py: 3 }}>
          {error ? 'No notifications available.' : 'No notifications.'}
        </Typography>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNotifications.map((n) => (
                <TableRow
                  key={n._id}
                  sx={{
                    cursor: n.link ? 'pointer' : 'default',
                    bgcolor: n.read ? 'transparent' : 'action.hover',
                    borderLeft: `4px solid ${n.read ? '#e0e0e0' : getTypeColor(n.type)}`,
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <TableCell>
                    <Chip label={getTypeLabel(n.type)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      <strong>{n.title}</strong><br />
                      {n.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    {n.read ? <Chip label="Read" size="small" color="success" /> : <Chip label="Unread" size="small" color="warning" />}
                  </TableCell>
                  <TableCell>
                    {!n.read && (
                      <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default Notifications;