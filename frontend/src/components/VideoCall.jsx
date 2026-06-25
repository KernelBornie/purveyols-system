import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, CircularProgress,
  Alert, Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://purveyols-backend.onrender.com';

const VideoCall = ({ open, onClose, recipientId, recipientName }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCall, setIncomingCall] = useState(null);
  const [error, setError] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      newSocket.emit('register', user.id);
    });

    newSocket.on('incoming-call', ({ from, offer }) => {
      setIncomingCall({ from, offer });
      setCallStatus('ringing');
    });

    newSocket.on('call-answered', ({ answer }) => {
      if (peerRef.current) {
        peerRef.current.signal(answer);
        setCallStatus('connected');
      }
    });

    newSocket.on('ice-candidate', ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    });

    newSocket.on('call-ended', () => {
      endCall();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [open, user]);

  const startCall = async () => {
    try {
      setCallStatus('calling');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerInstance = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      });

      peerInstance.on('signal', (data) => {
        socket.emit('call-user', {
          to: recipientId,
          offer: data,
        });
      });

      peerInstance.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setCallStatus('connected');
      });

      peerInstance.on('error', (err) => {
        setError('Call failed: ' + err.message);
        endCall();
      });

      peerRef.current = peerInstance;
    } catch (err) {
      setError('Could not access camera/microphone: ' + err.message);
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerInstance = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
      });

      peerInstance.on('signal', (data) => {
        socket.emit('answer-call', {
          to: incomingCall.from,
          answer: data,
        });
      });

      peerInstance.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setCallStatus('connected');
      });

      peerInstance.signal(incomingCall.offer);
      peerRef.current = peerInstance;
      setIncomingCall(null);
    } catch (err) {
      setError('Could not access camera/microphone: ' + err.message);
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
    setCallStatus('idle');
    onClose();
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallStatus('ended');
    if (socket && recipientId) {
      socket.emit('end-call', { to: recipientId });
    }
    setTimeout(() => {
      onClose();
      setCallStatus('idle');
    }, 1000);
  };

  return (
    <Dialog open={open} onClose={endCall} maxWidth="md" fullWidth>
      <DialogTitle>
        Video Call {recipientName ? `with ${recipientName}` : ''}
        <IconButton
          onClick={endCall}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {incomingCall && callStatus === 'ringing' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}>
              {recipientName?.charAt(0) || '?'}
            </Avatar>
            <Typography variant="h6">Incoming call from {recipientName || 'someone'}</Typography>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" color="success" onClick={answerCall}>
                Answer
              </Button>
              <Button variant="contained" color="error" onClick={rejectCall}>
                Decline
              </Button>
            </Box>
          </Box>
        )}

        {callStatus === 'idle' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" gutterBottom>
              Click below to start a video call with {recipientName}
            </Typography>
            <Button variant="contained" size="large" onClick={startCall}>
              Start Call
            </Button>
          </Box>
        )}

        {callStatus === 'calling' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Calling {recipientName}...
            </Typography>
          </Box>
        )}

        {callStatus === 'connected' && (
          <Box sx={{ position: 'relative' }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxHeight: '400px',
                background: '#333',
                borderRadius: 8,
              }}
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                width: '120px',
                height: '90px',
                borderRadius: 8,
                border: '2px solid white',
                background: '#222',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}

        {callStatus === 'ended' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">Call ended</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {callStatus === 'connected' && (
          <Button variant="contained" color="error" onClick={endCall}>
            End Call
          </Button>
        )}
        {(callStatus === 'idle' || callStatus === 'ended') && (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VideoCall;