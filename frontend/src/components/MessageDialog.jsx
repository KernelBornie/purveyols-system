import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Box, Alert, Chip, Avatar, ListItemIcon, Typography, CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import api from '../api/axios';

const MessageDialog = ({ open, onClose, onSent }) => {
  const [users, setUsers] = useState([]);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/api/users').then(res => setUsers(res.data)).catch(() => {});
    }
  }, [open]);

  const handleSend = async () => {
    if (!to || !content) {
      setError('Please select a recipient and enter a message');
      return;
    }
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

  return (
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
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <Typography variant="body2">{u.name} ({u.role})</Typography>
                </MenuItem>
              ))}
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
  );
};

export default MessageDialog;
