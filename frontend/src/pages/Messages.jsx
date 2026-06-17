import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  Button, Badge, Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import MarkAsReadIcon from '@mui/icons-material/MarkAsRead';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0); // 0: Inbox, 1: Sent (we'll add sent later if needed)
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/messages');
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      fetchMessages();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleView = (msg) => {
    setSelectedMessage(msg);
    setOpenDialog(true);
    if (!msg.read) handleMarkRead(msg._id);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Messages</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchMessages} variant="outlined">
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Inbox <Chip label={unreadCount} color={unreadCount > 0 ? 'error' : 'default'} size="small" />
          </Typography>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : messages.length === 0 ? (
          <Typography color="textSecondary">No messages</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg._id} sx={{ bgcolor: msg.read ? 'transparent' : 'action.hover' }}>
                  <TableCell>{msg.from?.name || 'Unknown'}</TableCell>
                  <TableCell>{msg.subject || '(no subject)'}</TableCell>
                  <TableCell>{msg.content?.substring(0, 50)}...</TableCell>
                  <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {msg.read ? (
                      <Chip label="Read" size="small" color="success" />
                    ) : (
                      <Chip label="Unread" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(msg)}>
                      <MarkAsReadIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(msg._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Message</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <>
              <DialogContentText>
                <strong>From:</strong> {selectedMessage.from?.name} ({selectedMessage.from?.role})
              </DialogContentText>
              <DialogContentText>
                <strong>Subject:</strong> {selectedMessage.subject || '(no subject)'}
              </DialogContentText>
              <DialogContentText>
                <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
              </DialogContentText>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2">{selectedMessage.content}</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages;
