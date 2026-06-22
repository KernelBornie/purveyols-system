import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Avatar, Paper, CircularProgress,
  IconButton, Chip, Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AIAssistant = ({ open, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Auto‑scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load chat history when modal opens
  useEffect(() => {
    if (open) {
      loadHistory();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/api/chat-history');
      const history = res.data;
      if (history && history.messages && history.messages.length > 0) {
        setMessages(history.messages);
      } else {
        // Default welcome
        setMessages([
          { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
        ]);
      }
    } catch (err) {
      // Silent fail – use default
      setMessages([
        { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Save user message to history
      await api.post('/api/chat-history/message', { sender: 'user', text: input, type: 'user' });

      const res = await api.post('/api/ai/chat', { message: input });
      let responseText = 'I could not process your request.';
      if (res.data && res.data.response) {
        if (typeof res.data.response === 'string') {
          responseText = res.data.response;
        } else if (typeof res.data.response === 'object' && res.data.response.text) {
          responseText = res.data.response.text;
        } else {
          responseText = JSON.stringify(res.data.response);
        }
      }
      const aiMsg = {
        sender: 'ai',
        text: responseText,
        type: res.data.response?.type || 'general',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save AI response to history
      await api.post('/api/chat-history/message', { sender: 'ai', text: responseText, type: res.data.response?.type || 'general' });

    } catch (err) {
      console.error('AI error:', err);
      const errorMsg = err.response?.data?.response || 'Sorry, I encountered an error. Please try again.';
      setError(errorMsg);
      const errorAiMsg = { sender: 'ai', text: errorMsg, type: 'error', timestamp: new Date() };
      setMessages(prev => [...prev, errorAiMsg]);
      // Save error message to history too
      try {
        await api.post('/api/chat-history/message', { sender: 'ai', text: errorMsg, type: 'error' });
      } catch (e) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (index) => {
    const msg = messages[index];
    if (!msg || !msg._id) return; // Must have an ID from history

    if (!window.confirm('Delete this message?')) return;

    try {
      await api.delete(`/api/chat-history/message/${msg._id}`);
      // Remove from local state
      setMessages(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { height: '70vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6">PURVEYOLS ASSISTANT AI</Typography>
          <Chip label="Beta" size="small" color="primary" />
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            {msg.sender === 'ai' && (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
            )}
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '80%',
                bgcolor: msg.sender === 'user' ? 'primary.main' : msg.type === 'error' ? 'error.light' : 'grey.100',
                color: msg.sender === 'user' ? 'white' : 'text.primary',
                borderRadius: 2,
                whiteSpace: 'pre-wrap',
                position: 'relative',
              }}
            >
              <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
              {msg.timestamp && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.6 }}>
                  {formatTime(msg.timestamp)}
                </Typography>
              )}
              {msg._id && (
                <IconButton
                  size="small"
                  onClick={() => handleDeleteMessage(idx)}
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
            {msg.sender === 'user' && (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>U</Avatar>
            )}
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper sx={{ p: 1.5, bgcolor: 'grey.100' }}>
              <CircularProgress size={20} />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Ask PURVEYOLS ASSISTANT AI about construction or system data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          startIcon={<SendIcon />}
        >
          {loading ? '...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIAssistant;
