import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  Button, Badge, Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/messages');
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(sorted);
      const unread = sorted.filter(m => !m.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
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
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      fetchMessages();
    } catch (err) { console.error(err); }
  };

  const handleViewMessage = (msg) => {
    setSelectedMessage(msg);
    setDialogOpen(true);
    if (!msg.read) handleMarkRead(msg._id);
  };

  const filteredMessages = tabValue === 0 ? messages : messages.filter(m => m.read);

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
          <Tab label="All Messages" />
          <Tab label="Read" />
        </Tabs>

        {loading ? (
          <CircularProgress />
        ) : filteredMessages.length === 0 ? (
          <Typography align="center" color="textSecondary">No messages</Typography>
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
              {filteredMessages.map((msg) => (
                <TableRow
                  key={msg._id}
                  sx={{
                    bgcolor: msg.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                  onClick={() => handleViewMessage(msg)}
                >
                  <TableCell>{msg.from?.name || 'Unknown'}</TableCell>
                  <TableCell>{msg.subject || '(no subject)'}</TableCell>
                  <TableCell>{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {msg.read ? <Chip label="Read" size="small" color="success" /> : <Chip label="Unread" size="small" color="warning" />}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleViewMessage(msg); }}
                    >
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

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
        </DialogContent>
        <Button onClick={() => setDialogOpen(false)}>Close</Button>
      </Dialog>
    </Box>
  );
};

export default Messages;
