import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Tooltip, Alert, CircularProgress, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, ListItemIcon, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import MessageDialog from '../../components/MessageDialog';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('compose');
  const [initialTo, setInitialTo] = useState('');
  const [initialSubject, setInitialSubject] = useState('');
  const [initialContent, setInitialContent] = useState('');

  // ─── Detail view state ──────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  // ─── Compose ──────────────────────────────────────────────────────
  const handleCompose = () => {
    setDialogMode('compose');
    setInitialTo('');
    setInitialSubject('');
    setInitialContent('');
    setDialogOpen(true);
  };

  // ─── Reply ────────────────────────────────────────────────────────
  const handleReply = (message) => {
    setDialogMode('reply');
    setInitialTo(message.from._id);
    setInitialSubject(`Re: ${message.subject || 'Your message'}`);
    setInitialContent('');
    setDialogOpen(true);
  };

  // ─── Forward ──────────────────────────────────────────────────────
  const handleForward = (message) => {
    setDialogMode('forward');
    setInitialTo('');
    setInitialSubject(`Fwd: ${message.subject || 'Your message'}`);
    setInitialContent(message.content);
    setDialogOpen(true);
  };

  // ─── View Detail ──────────────────────────────────────────────────
  const handleViewDetail = async (message) => {
    setLoadingDetail(true);
    setSelectedMessage(null);
    setDetailOpen(true);
    try {
      // Fetch the full message with attachments
      const res = await api.get(`/api/messages/${message._id}`);
      setSelectedMessage(res.data);
    } catch (err) {
      alert('Failed to load message details');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getFileIcon = (attachment) => {
    const type = attachment.type;
    if (type === 'image') return <ImageIcon />;
    if (type === 'audio') return <AudioFileIcon />;
    if (type === 'video') return <VideoFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const getFileTypeLabel = (attachment) => {
    const type = attachment.type;
    if (type === 'image') return 'Image';
    if (type === 'audio') return 'Audio';
    if (type === 'video') return 'Video';
    return 'Document';
  };

  const renderAttachment = (attachment) => {
    const url = attachment.url;
    const filename = attachment.filename;
    const type = attachment.type;

    if (type === 'audio') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <AudioFileIcon />
          <audio controls style={{ flex: 1, minWidth: '150px' }}>
            <source src={url} />
            Your browser does not support the audio element.
          </audio>
          <Button size="small" startIcon={<DownloadIcon />} href={url} download={filename}>
            Download
          </Button>
        </Box>
      );
    }

    if (type === 'video') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          <video controls style={{ maxWidth: '100%', maxHeight: '300px' }}>
            <source src={url} />
            Your browser does not support the video element.
          </video>
          <Button size="small" startIcon={<DownloadIcon />} href={url} download={filename}>
            Download
          </Button>
        </Box>
      );
    }

    if (type === 'image') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          <img src={url} alt={filename} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
          <Button size="small" startIcon={<DownloadIcon />} href={url} download={filename}>
            Download
          </Button>
        </Box>
      );
    }

    // Document
    return (
      <Button
        variant="outlined"
        startIcon={<InsertDriveFileIcon />}
        href={url}
        download={filename}
        fullWidth
      >
        Download {filename}
      </Button>
    );
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
            onClick={handleCompose}
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
                <TableCell>
                  {m.subject || '(no subject)'}
                  {m.attachments && m.attachments.length > 0 && (
                    <Tooltip title={`${m.attachments.length} attachment(s)`}>
                      <AttachFileIcon fontSize="small" color="action" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>
                  {m.read ? <Chip label="Read" size="small" color="success" /> : <Chip label="Unread" size="small" color="warning" />}
                </TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => handleViewDetail(m)} color="info">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!m.read && (
                    <Tooltip title="Mark as read">
                      <IconButton size="small" onClick={() => handleMarkRead(m._id)}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Reply">
                    <IconButton size="small" onClick={() => handleReply(m)} color="primary">
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Forward">
                    <IconButton size="small" onClick={() => handleForward(m)} color="secondary">
                      <ForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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

      {/* ─── Compose Dialog ─────────────────────────────────────────── */}
      <MessageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSent={handleMessageSent}
        mode={dialogMode}
        initialTo={initialTo}
        initialSubject={initialSubject}
        initialContent={initialContent}
      />

      {/* ─── Message Detail Dialog ──────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Message Details
          <IconButton
            aria-label="close"
            onClick={() => setDetailOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail ? (
            <CircularProgress />
          ) : selectedMessage ? (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">From</Typography>
                <Typography variant="body1">{selectedMessage.from?.name} ({selectedMessage.from?.role})</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                <Typography variant="body1">{selectedMessage.subject || '(no subject)'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                <Typography variant="body1">{new Date(selectedMessage.createdAt).toLocaleString()}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Message</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedMessage.content || '(empty)'}
                </Typography>
              </Box>

              {/* ─── Attachments ────────────────────────────────────── */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Attachments ({selectedMessage.attachments.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedMessage.attachments.map((att, idx) => (
                      <Paper key={idx} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getFileIcon(att)}
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {att.filename}
                          </Typography>
                          <Chip label={getFileTypeLabel(att)} size="small" />
                          <Typography variant="caption" color="textSecondary">
                            {(att.size / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                        {renderAttachment(att)}
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Typography>Message not found.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Messages;