import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Box, Alert, Chip, Avatar, ListItemIcon, Typography, CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MessageDialog = ({ open, onClose, onSent }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  useEffect(() => {
    if (open) {
      api.get('/api/users')
        .then(res => {
          const filtered = res.data.filter(u => u._id !== user?.id);
          setUsers(filtered);
        })
        .catch(err => console.error('Failed to fetch users', err));
    }
  }, [open, user]);

  const handleSend = async () => {
    if (!to || !content) {
      setError('Please select a recipient and enter a message');
      return;
    }
    // Find recipient name for confirmation
    const recipient = users.find(u => u._id === to);
    setSelectedRecipient(recipient);
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/messages', { to, subject, content });
      setSuccess(true);
      setContent('');
      setSubject('');
      setTo('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        if (onSent) onSent();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSend = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Message sent!</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Recipient</InputLabel>
              <Select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                label="Recipient"
              >
                {users.length === 0 ? (
                  <MenuItem disabled>No other users found</MenuItem>
                ) : (
                  users.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <Typography variant="body2">{u.name} ({u.role})</Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <TextField
              label="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
            />
            <TextField
              label="Message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSend} variant="contained" startIcon={<SendIcon />} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancelSend} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Recipient</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to send this message to:
          </Typography>
          <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedRecipient?.name} ({selectedRecipient?.role})
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Subject: {subject || '(no subject)'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, wordWrap: 'break-word', maxHeight: 100, overflow: 'auto' }}>
            {content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSend}>Cancel</Button>
          <Button onClick={handleConfirmSend} variant="contained" color="primary">
            Confirm Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageDialog;
