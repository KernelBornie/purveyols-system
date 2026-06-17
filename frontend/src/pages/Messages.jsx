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
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/messages');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      try {
        await api.delete(`/api/messages/${id}`);
        fetchMessages();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleView = (message) => {
    setSelectedMessage(message);
    setDialogOpen(true);
    if (!message.read) {
      handleMarkRead(message._id);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMessage(null);
  };

  const filteredMessages = tabValue === 0
    ? messages
    : messages.filter(m => m.read);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Messages</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchMessages}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="All" />
          <Tab label="Read" />
        </Tabs>

        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : filteredMessages.length === 0 ? (
          <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
            No messages to display.
          </Typography>
        ) : (
          <Table>
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
                <TableRow key={m._id} sx={{ bgcolor: m.read ? 'transparent' : 'action.hover' }}>
                  <TableCell>{m.from?.name || 'Unknown'}</TableCell>
                  <TableCell>{m.subject || '(no subject)'}</TableCell>
                  <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {m.read ? (
                      <Chip label="Read" size="small" color="success" />
                    ) : (
                      <Chip label="Unread" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(m)}>
                      <MarkAsReadIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(m._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedMessage?.subject || 'Message'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            From: {selectedMessage?.from?.name || 'Unknown'} ({selectedMessage?.from?.role || 'N/A'})
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Date: {selectedMessage?.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : ''}
          </Typography>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedMessage?.content}
          </DialogContentText>
        </DialogContent>
        <Button onClick={handleCloseDialog}>Close</Button>
      </Dialog>
    </Box>
  );
};

export default Messages;
