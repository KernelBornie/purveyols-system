import BackButton from '../components/BackButton';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  Button, Badge, Tabs, Tab, CircularProgress, Alert, TextField, Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import api from '../api/axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [replySuccess, setReplySuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get('/api/messages'),
        api.get('/api/messages/sent')
      ]);
      const sortedInbox = inboxRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const sortedSent = sentRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(sortedInbox);
      setSentMessages(sortedSent);
      const unread = sortedInbox.filter(m => !m.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to load messages', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleTabChange = (e, newValue) => setTabValue(newValue);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to mark as read', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      setSnackbar({ open: true, message: 'Message deleted', severity: 'success' });
      fetchMessages();
    } catch (err) {
      console.error('Delete error:', err);
      let errorMsg = 'Failed to delete message. ';
      if (err.response) {
        errorMsg += err.response.data?.error || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMsg += 'No response from server. Check your connection.';
      } else {
        errorMsg += err.message;
      }
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleViewMessage = (msg) => {
    setSelectedMessage(msg);
    setDialogOpen(true);
    if (!msg.read) handleMarkRead(msg._id);
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    setReplySubject(msg.subject ? `Re: ${msg.subject}` : 'Re: Your message');
    setReplyContent('');
    setReplyError(null);
    setReplySuccess(false);
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      setReplyError('Please enter a message');
      return;
    }
    setSending(true);
    setReplyError(null);
    try {
      await api.post('/api/messages', {
        to: replyTo.from._id,
        subject: replySubject,
        content: replyContent
      });
      setReplySuccess(true);
      setTimeout(() => {
        setReplyDialogOpen(false);
        setReplySuccess(false);
        fetchMessages();
      }, 1500);
    } catch (err) {
      setReplyError(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = tabValue === 0 ? messages : (tabValue === 1 ? messages.filter(m => m.read) : sentMessages);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Messages
          <Badge badgeContent={unreadCount} color="primary" sx={{ ml: 2 }}>
            <span style={{ fontSize: '1rem' }}>Unread</span>
          </Badge>
        </Typography>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchMessages}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="All Inbox" />
          <Tab label="Read" />
          <Tab label="Sent" />
        </Tabs>

        {loading ? (
          <CircularProgress />
        ) : filteredMessages.length === 0 ? (
          <Typography align="center" color="textSecondary">No messages</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{tabValue === 2 ? 'To' : 'From'}</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMessages.map((msg) => (
                <TableRow key={msg._id} sx={{ bgcolor: (!msg.read && tabValue !== 2) ? 'action.hover' : 'transparent' }}>
                  <TableCell>{tabValue === 2 ? msg.to?.name || 'Unknown' : msg.from?.name || 'Unknown'}</TableCell>
                  <TableCell>{msg.subject || '(no subject)'}</TableCell>
                  <TableCell>{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {tabValue === 2 ? (
                      <Chip label="Sent" size="small" color="info" />
                    ) : msg.read ? (
                      <Chip label="Read" size="small" color="success" />
                    ) : (
                      <Chip label="Unread" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewMessage(msg)}>
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                    {tabValue !== 2 && (
                      <IconButton size="small" color="primary" onClick={() => handleReply(msg)}>
                        <ReplyIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => handleDelete(msg._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* View Message Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedMessage?.subject || 'Message'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>From:</strong> {selectedMessage?.from?.name || 'Unknown'} <br />
            <strong>Date:</strong> {selectedMessage?.createdAt && new Date(selectedMessage.createdAt).toLocaleString()}
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            {selectedMessage?.content}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" startIcon={<ReplyIcon />} onClick={() => { setDialogOpen(false); handleReply(selectedMessage); }}>
              Reply
            </Button>
          </Box>
        </DialogContent>
        <Button onClick={() => setDialogOpen(false)}>Close</Button>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to {replyTo?.from?.name}</DialogTitle>
        <DialogContent>
          {replyError && <Alert severity="error" sx={{ mb: 2 }}>{replyError}</Alert>}
          {replySuccess && <Alert severity="success" sx={{ mb: 2 }}>Reply sent!</Alert>}
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            value={replySubject}
            onChange={(e) => setReplySubject(e.target.value)}
          />
          <TextField
            label="Message"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            required
          />
        </DialogContent>
        <Button onClick={() => setReplyDialogOpen(false)} disabled={sending}>Cancel</Button>
        <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendReply} disabled={sending}>
          {sending ? 'Sending...' : 'Send Reply'}
        </Button>
      </Dialog>
    </Box>
  );
};

export default Messages;
