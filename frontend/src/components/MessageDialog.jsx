import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Box, Alert, Chip, Avatar, ListItemIcon, Typography, CircularProgress,
  IconButton, LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import VideocamIcon from '@mui/icons-material/Videocam';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SimplePeer from 'simple-peer';

const MessageDialog = ({
  open,
  onClose,
  onSent,
  mode = 'compose',
  initialTo = '',
  initialSubject = '',
  initialContent = '',
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Video chat state ──────────────────────────────────────────
  const [callOpen, setCallOpen] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTo(initialTo);
      setSubject(initialSubject);
      setContent(initialContent);
      setFiles([]);
      setRecordedAudio(null);
    }
  }, [open, initialTo, initialSubject, initialContent]);

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

  // ─── File handling ──────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    if (type.startsWith('video/')) return <VideoFileIcon />;
    return <InsertDriveFileIcon />;
  };

  // ─── Voice recording ────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setRecordedAudio(file);
        setFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  // ─── Send message ──────────────────────────────────────────────
  const handleSend = async () => {
    if (!to || (!content && files.length === 0)) {
      setError('Please select a recipient and enter a message or attach a file');
      return;
    }
    const recipient = users.find(u => u._id === to);
    setSelectedRecipient(recipient);
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('content', content);
    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const res = await api.post('/api/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setSuccess(true);
      setContent('');
      setSubject('');
      setTo('');
      setFiles([]);
      setRecordedAudio(null);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        if (onSent) onSent();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleCancelSend = () => {
    setConfirmOpen(false);
  };

  // ─── Video call ──────────────────────────────────────────────────
  const startVideoCall = async () => {
    if (!to) {
      setError('Please select a recipient first.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      // Create a peer connection
      const peerInstance = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      });

      peerInstance.on('signal', (data) => {
        // For simplicity, we'll open the call window and copy the signal
        const signalStr = JSON.stringify(data);
        alert('Copy this signal and send it to the recipient:\n' + signalStr);
        localStorage.setItem('callSignal', signalStr);
        setCallerId(user.id);
      });

      peerInstance.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      setPeer(peerInstance);
      setCallOpen(true);
    } catch (err) {
      setError('Could not start video call: ' + err.message);
    }
  };

  const joinVideoCall = () => {
    const signalStr = prompt('Paste the signal from the caller:');
    if (!signalStr) return;
    try {
      const signal = JSON.parse(signalStr);
      const peerInstance = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStream,
      });

      peerInstance.signal(signal);
      peerInstance.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
      setPeer(peerInstance);
      setCallOpen(true);
    } catch (err) {
      setError('Invalid signal: ' + err.message);
    }
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallOpen(false);
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'reply':
        return 'Reply to Message';
      case 'forward':
        return 'Forward Message';
      default:
        return 'Compose New Message';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {getDialogTitle()}
          <Button
            variant="outlined"
            size="small"
            startIcon={<VideocamIcon />}
            onClick={startVideoCall}
            sx={{ float: 'right' }}
          >
            Video Call
          </Button>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Message sent!</Alert>}
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption">Uploading {uploadProgress}%</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {mode === 'compose' || mode === 'forward' ? (
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
            ) : (
              <TextField
                label="Recipient"
                value={users.find(u => u._id === to)?.name || 'Unknown'}
                fullWidth
                disabled
                sx={{ mb: 1 }}
              />
            )}
            <TextField
              label="Subject"
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
              required={files.length === 0}
              placeholder={mode === 'reply' ? 'Type your reply here...' : 'Type your message...'}
            />

            {/* ─── Attachments ────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                size="small"
              >
                Attach Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </Button>

              {/* Voice recording */}
              {!recording ? (
                <Button
                  variant="outlined"
                  startIcon={<MicIcon />}
                  size="small"
                  onClick={startRecording}
                >
                  Record Voice
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  size="small"
                  onClick={stopRecording}
                >
                  Stop {recordingTime}s
                </Button>
              )}
            </Box>

            {/* Selected files */}
            {files.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {files.map((file, idx) => (
                  <Chip
                    key={idx}
                    icon={getFileIcon(file)}
                    label={file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                    onDelete={() => removeFile(idx)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={loading || (!content && files.length === 0)}
          >
            {loading ? 'Sending...' : mode === 'reply' ? 'Send Reply' : mode === 'forward' ? 'Forward' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Video Call Dialog ────────────────────────────────────── */}
      <Dialog open={callOpen} onClose={endCall} maxWidth="md" fullWidth>
        <DialogTitle>Video Call {callerId === user.id ? '(You are the caller)' : ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '400px', background: '#333' }}
            />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '120px', position: 'absolute', bottom: 20, right: 20, border: '2px solid white', borderRadius: 8 }}
            />
            {!callerId && (
              <Button variant="contained" onClick={joinVideoCall} sx={{ mt: 2 }}>
                Join Call (paste signal)
              </Button>
            )}
            <Button variant="contained" color="error" onClick={endCall} sx={{ mt: 2 }}>
              End Call
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ─── Confirmation Dialog ──────────────────────────────────── */}
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
          {files.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Attachments: {files.length} file(s)
            </Typography>
          )}
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