import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Tooltip, Alert, CircularProgress, Button, Tabs, Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import api from '../../api/axios';          // ✅ correct path
import BackButton from '../../components/BackButton';
import MessageDialog from '../../components/MessageDialog';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/messages');
      setMessages(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      fetchMessages();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // ─── DELETE ALL ────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL messages? This cannot be undone.')) return;
    try {
      await api.delete('/api/messages');
      fetchMessages();
    } catch (err) {
      alert('Failed to delete all messages');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleMessageSent = () => {
    fetchMessages();
  };

  const filteredMessages = tab === 0 ? messages : tab === 1 ? messages.filter(m => m.read) : messages.filter(m => !m.read);

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Messages</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<MessageIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Compose
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchMessages} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleDeleteAll}
            disabled={messages.length === 0}
          >
            Delete All
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 2 }}>
        <Tab label={`All (${messages.length})`} />
        <Tab label={`Read (${messages.filter(m => m.read).length})`} />
        <Tab label={`Unread (${messages.filter(m => !m.read).length})`} />
      </Tabs>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredMessages.length === 0 ? (
        <Typography align="center" color="textSecondary" sx={{ py: 3 }}>No messages</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>From</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.map((m) => (
              <TableRow
                key={m._id}
                sx={{ bgcolor: m.read ? 'transparent' : 'action.hover' }}
              >
                <TableCell>{m.from?.name || 'Unknown'}</TableCell>
                <TableCell>{m.subject || '(no subject)'}</TableCell>
                <TableCell>
                  {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>
                  {m.read ? <Chip label="Read" size="small" color="success" /> : <Chip label="Unread" size="small" color="warning" />}
                </TableCell>
                <TableCell>
                  {!m.read && (
                    <Tooltip title="Mark as read">
                      <IconButton size="small" onClick={() => handleMarkRead(m._id)}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(m._id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MessageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSent={handleMessageSent}
      />
    </Paper>
  );
};

export default Messages;