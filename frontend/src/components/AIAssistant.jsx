import React, { useState } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Avatar, Paper, CircularProgress,
  IconButton, Chip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I\'m your PURVEYOLS ASSISTANT AI. Ask me about project planning, materials, costs, safety, or any construction-related topic!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (in production, call an actual AI API)
    setTimeout(() => {
      const responses = [
        "Based on PURVEYOLS best practices, I recommend using reinforced concrete for the foundation. The typical mix ratio is 1:2:4 (cement:sand:aggregate).",
        "According to current market data, the estimated cost per square meter is about ZMW 4,500 for standard finishing.",
        "PURVEYOLS recommends using local suppliers for cement – it reduces lead time and supports the local economy. ZAMCEM and Larfarge are reliable.",
        "For safety compliance, ensure you have proper PPE (helmets, boots, vests) and conduct regular safety briefings on site. This is a PURVEYOLS standard.",
        "The project timeline seems feasible. PURVEYOLS suggests breaking it down into phases: foundation, structure, finishing, and landscaping.",
        "Regarding procurement: get at least 3 quotes from different suppliers. Compare quality and delivery timelines, not just price.",
        "Remember to factor in a 10-15% contingency for unexpected costs. It's always better to over-budget than under-budget.",
        "For the electrical work, make sure the contractor is ERB registered. Check their references before hiring.",
        "PURVEYOLS ASSISTANT AI recommends using sustainable materials where possible – it reduces long-term costs and environmental impact.",
        "For site preparation, always conduct a soil test first. PURVEYOLS has a checklist available for site readiness."
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
      setLoading(false);
    }, 1000);
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
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
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
            placeholder="Ask PURVEYOLS ASSISTANT AI about construction..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            startIcon={<SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AIAssistant;
