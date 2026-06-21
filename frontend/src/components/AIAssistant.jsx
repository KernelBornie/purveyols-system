import React, { useState, useEffect } from 'react';
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

const AIAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/api/chat-history');
        const history = res.data;
        if (history && history.messages && history.messages.length > 0) {
          setMessages(history.messages);
        }
      } catch (err) {
        console.log('History load skipped');
      }
    };
    if (open) {
      loadHistory();
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/ai/chat', { message: input });
      const aiResponse = res.data.response;

      // ─── SAFELY extract response text ─────────────────────────────
      let responseText = '';
      if (typeof aiResponse === 'string') {
        responseText = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object') {
        // If it has a text property, use it
        if (aiResponse.text && typeof aiResponse.text === 'string') {
          responseText = aiResponse.text;
        } else if (aiResponse.message && typeof aiResponse.message === 'string') {
          responseText = aiResponse.message;
        } else {
          responseText = JSON.stringify(aiResponse);
        }
      } else {
        responseText = 'I received your message but could not process it.';
      }

      const aiMsg = { 
        sender: 'ai', 
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Save to history
      try {
        await api.post('/api/chat-history/message', { 
          sender: 'user', 
          text: input,
          type: 'user'
        });
        await api.post('/api/chat-history/message', { 
          sender: 'ai', 
          text: responseText,
          type: 'general'
        });
      } catch (e) {
        console.log('History save skipped');
      }
    } catch (err) {
      console.error('AI error:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Sorry, I encountered an error. Please try again.');
      }
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 24, left: 24 }}
        onClick={() => setOpen(true)}
      >
        <SmartToyIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
          <IconButton onClick={() => setOpen(false)}>
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
                  bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
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
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Ask PURVEYOLS ASSISTANT AI about construction or system data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
    </>
  );
};

export default AIAssistant;
