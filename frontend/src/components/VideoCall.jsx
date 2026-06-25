import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Alert,
  TextField, Chip, Avatar, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../context/AuthContext';

// ─── Jitsi Meet configuration ──────────────────────────────────────
const JITSI_DOMAIN = 'meet.jit.si'; // Free public Jitsi server
const JITSI_APP_NAME = 'PURVEYOLS'; // Your app name

const VideoCall = ({ open, onClose, recipientId, recipientName }) => {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  // ─── Generate a unique room name ──────────────────────────────────
  useEffect(() => {
    if (open && user) {
      const timestamp = Date.now().toString(36);
      const userId = user.id.slice(-6);
      const room = `${JITSI_APP_NAME}-${userId}-${timestamp}`;
      setRoomName(room);
      setMeetingUrl(`https://${JITSI_DOMAIN}/${room}`);
      setIframeLoaded(false);
      setLoading(true);
    }
  }, [open, user]);

  // ─── Load Jitsi script dynamically ──────────────────────────────
  useEffect(() => {
    if (!open || !roomName) return;

    // Clean up previous instance
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }

    // Check if Jitsi script is already loaded
    if (document.getElementById('jitsi-script')) {
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-script';
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => {
      initJitsi();
    };
    script.onerror = () => {
      setLoading(false);
      alert('Failed to load video call. Please check your internet connection.');
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = '';
      }
    };
  }, [open, roomName]);

  // ─── Initialize Jitsi Meet ────────────────────────────────────────
  const initJitsi = () => {
    if (!roomName || !window.JitsiMeetExternalAPI) {
      setLoading(false);
      return;
    }

    try {
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || 'User',
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          disableInviteFunctions: true, // We'll handle invites ourselves
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1a1a2e',
        },
      };

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      apiRef.current = api;

      api.addEventListener('readyToClose', () => {
        handleClose();
      });

      api.addEventListener('videoConferenceJoined', () => {
        setLoading(false);
        setIframeLoaded(true);
      });

      setIframeLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error('Jitsi initialization error:', err);
      setLoading(false);
      alert('Failed to start video call. Please try again.');
    }
  };

  // ─── Copy meeting link to clipboard ──────────────────────────────
  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = meetingUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Share meeting link via Web Share API ────────────────────────
  const shareMeetingLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Video Meeting with ${user?.name}`,
          text: `Join me on PURVEYOLS video meeting: ${meetingUrl}`,
          url: meetingUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      copyMeetingLink();
    }
  };

  const handleClose = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setIframeLoaded(false);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Video Meeting {recipientName ? `with ${recipientName}` : ''}
          </Typography>
          <Box>
            <IconButton onClick={shareMeetingLink} color="primary" title="Share meeting link">
              <ShareIcon />
            </IconButton>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, position: 'relative', minHeight: '400px' }}>
        {/* ─── Meeting info bar ──────────────────────────────────────── */}
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label="🔗 Meeting link"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px' }}>
            {meetingUrl}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={copyMeetingLink}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={shareMeetingLink}
          >
            Share Invite
          </Button>
        </Box>

        {/* ─── Jitsi iframe container ─────────────────────────────────── */}
        <Box
          ref={jitsiContainerRef}
          sx={{
            width: '100%',
            height: { xs: '300px', sm: '450px', md: '550px' },
            bgcolor: '#1a1a2e',
          }}
        />

        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Loading meeting...
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="error">
          Leave Meeting
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoCall;