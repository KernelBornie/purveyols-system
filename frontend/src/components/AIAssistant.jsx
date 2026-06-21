import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
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

  // ─── Auto-scroll to bottom ──────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ─── Focus input when dialog opens ──────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      // Load chat history if available
      loadChatHistory();
    }
  }, [open]);

  // ─── Load chat history ──────────────────────────────────
  const loadChatHistory = async () => {
    try {
      // You can add an endpoint to fetch chat history if you want
      // For now, start with a welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Hello ${user?.name || 'there'}! I'm your construction assistant.\n\nAsk me about:\n• Projects & budgets\n• Workers & attendance\n• Funding requests\n• Procurement orders\n• BOQs & subcontracts\n• General construction questions`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // ─── Send message ────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMessage = {
      id: Date.now() + '-user',
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Call AI backend
      const response = await api.post('/api/ai/chat', { message: trimmed });

      const aiMessage = {
        id: Date.now() + '-assistant',
        role: 'assistant',
        content: response.data.response || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI error:', err);
      const errorMsg = {
        id: Date.now() + '-error',
        role: 'assistant',
        content: err.response?.data?.response || '❌ I\'m having trouble connecting to my AI service. Please try again in a moment.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setError('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle Enter key ────────────────────────────────────
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Clear chat ──────────────────────────────────────────
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello ${user?.name || 'there'}! I'm your construction assistant.\n\nAsk me about:\n• Projects & budgets\n• Workers & attendance\n• Funding requests\n• Procurement orders\n• BOQs & subcontracts\n• General construction questions`,
        timestamp: new Date(),
      },
    ]);
  };

  // ─── Format timestamp ────────────────────────────────────
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 700,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
        },
      }}
    >
      {/* ─── Header ────────────────────────────────────────── */}
      <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <SmartToyIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            PURVEYOLS ASSISTANT AI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ask me anything about your construction projects
          </Typography>
        </Box>
        <Chip label="BETA" size="small" color="primary" sx={{ mr: 1 }} />
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ─── Messages Area ────────────────────────────────── */}
      <DialogContent sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                maxWidth: '80%',
                p: 2,
                bgcolor: msg.role === 'user' ? 'primary.main' : '#fff',
                color: msg.role === 'user' ? '#fff' : 'text.primary',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {msg.role === 'assistant' ? (
                  <SmartToyIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
                ) : (
                  <PersonIcon fontSize="small" sx={{ color: '#fff', fontSize: 16 }} />
                )}
                <Typography variant="caption" fontWeight="bold">
                  {msg.role === 'user' ? user?.name || 'You' : 'AI Assistant'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#fff',
                borderRadius: '4px 16px 16px 16px',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Paper>
          </Box>
        )}

        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip label={error} color="error" size="small" />
          </Box>
        )}

        <div ref={messagesEndRef} />
      </DialogContent>

      {/* ─── Quick Questions ────────────────────────────────── */}
      <Divider />
      <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap', bgcolor: '#f5f5f5' }}>
        {[
          'What is the status of all current projects?',
          'Show me recent workers',
          'How many funding requests are pending?',
          'What is the total budget across all projects?',
        ].map((q) => (
          <Chip
            key={q}
            label={q}
            size="small"
            onClick={() => {
              setInput(q);
              setTimeout(sendMessage, 100);
            }}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', color: '#fff' } }}
          />
        ))}
        <Chip label="Clear Chat" size="small" color="warning" onClick={clearChat} sx={{ cursor: 'pointer' }} />
      </Box>

      {/* ─── Input Area ──────────────────────────────────────── */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: '#ccc' } }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default AIAssistant;
