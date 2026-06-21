import React, { useState, useEffect, useRef } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Avatar, Paper, CircularProgress,
  IconButton, Chip, Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AIAssistant = ({ open, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/api/chat-history');
      const history = res.data;
      if (history && history.messages && history.messages.length > 0) {
        setMessages(history.messages);
        return;
      }
    } catch (err) {
      // Silent fail
    }
    // Default welcome message
    setMessages([
      { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/ai/chat', { message: input });
      // Safely extract the response text
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
      
      // Save to history (optional)
      try {
        await api.post('/api/chat-history/message', { 
          sender: 'user', 
          text: input,
          type: 'user'
        });
        await api.post('/api/chat-history/message', { 
          sender: 'ai', 
          text: responseText,
          type: res.data.response?.type || 'general'
        });
      } catch (e) {
        // Silent fail
      }
    } catch (err) {
      console.error('AI error:', err);
      const errorMsg = err.response?.data?.response || 'Sorry, I encountered an error. Please try again.';
      setError(errorMsg);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: errorMsg,
        type: 'error',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              }}
            >
              <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
              {msg.timestamp && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.6 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
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
