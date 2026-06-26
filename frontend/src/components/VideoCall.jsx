import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Alert,
  TextField, Chip, Avatar, CircularProgress, Divider,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  Badge, Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const JITSI_DOMAIN = 'meet.jit.si';
const JITSI_APP_NAME = 'PURVEYOLS';

const VideoCall = ({ open, onClose, recipientId, recipientName }) => {
  const { user } = useAuth();
  const { socket, onlineUsers, inviteToMeeting } = useSocket(); // ✅ global
  const [roomName, setRoomName] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [onlineUserDetails, setOnlineUserDetails] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  // ─── Generate room name ──────────────────────────────────────────
  useEffect(() => {
    if (open && user) {
      const timestamp = Date.now().toString(36);
      const userId = user.id.slice(-6);
      const room = `${JITSI_APP_NAME}-${userId}-${timestamp}`;
      setRoomName(room);
      setMeetingUrl(`https://${JITSI_DOMAIN}/${room}`);
      setIframeLoaded(false);
      setLoading(true);
      setInvitedUsers([]);
    }
  }, [open, user]);

  // ─── Fetch online user details ──────────────────────────────────
  const fetchOnlineUsers = async () => {
    try {
      const res = await api.get('/api/users/online');
      const filtered = res.data.filter(u => u._id !== user?.id);
      setOnlineUserDetails(filtered);
    } catch (err) {
      console.error('Failed to fetch online users:', err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOnlineUsers();
      const interval = setInterval(fetchOnlineUsers, 10000);
      return () => clearInterval(interval);
    }
  }, [open, user]);

  // ─── Listen for incoming invites via global socket ──────────────
  useEffect(() => {
    if (!socket) return;

    const handleInvite = ({ from, meetingLink, meetingName }) => {
      setSnackbar({
        open: true,
        message: `${from.name} invited you to join "${meetingName}"`,
      });
      // Store invite so we can join later
      window._pendingInvite = { from, meetingLink, meetingName };
    };

    socket.on('meeting-invite', handleInvite);

    return () => {
      socket.off('meeting-invite', handleInvite);
    };
  }, [socket]);

  // ─── Load Jitsi script ──────────────────────────────────────────
  useEffect(() => {
    if (!open || !roomName) return;

    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }

    if (document.getElementById('jitsi-script')) {
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-script';
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => initJitsi();
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
          disableInviteFunctions: true,
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

      api.addEventListener('readyToClose', () => handleClose());

      api.addEventListener('videoConferenceJoined', () => {
        setLoading(false);
        setIframeLoaded(true);
      });

      setIframeLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error('Jitsi initialization error:', err);
      setLoading(false);
    }
  };

  // ─── Invite staff ──────────────────────────────────────────────────
  const handleInviteStaff = (staffId, staffName) => {
    inviteToMeeting(staffId, meetingUrl, `Meeting with ${user?.name}`);
    setInvitedUsers(prev => [...prev, staffId]);
    setSnackbar({ open: true, message: `Invitation sent to ${staffName}` });
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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

  // ─── Accept invite from snackbar ──────────────────────────────────
  const acceptInvite = () => {
    const invite = window._pendingInvite;
    if (invite) {
      window.open(invite.meetingLink, '_blank');
      window._pendingInvite = null;
      setSnackbar({ open: false, message: '' });
      handleClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Video Meeting {recipientName ? `with ${recipientName}` : ''}
            </Typography>
            <Box>
              <IconButton onClick={shareMeetingLink} color="primary" title="Share meeting link">
                <ShareIcon />
              </IconButton>
              <IconButton onClick={copyMeetingLink} color="info" title="Copy link">
                <ContentCopyIcon />
              </IconButton>
              {copied && <Chip label="Copied!" size="small" color="success" />}
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: 'relative', minHeight: '400px' }}>
          {/* ─── Staff invitations panel ───────────────────────────── */}
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <Typography variant="subtitle2" gutterBottom>
              <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Online Staff — Invite to join
            </Typography>
            {onlineUserDetails.length === 0 ? (
              <Typography variant="body2" color="textSecondary">No other staff online</Typography>
            ) : (
              <List dense sx={{ maxHeight: 120, overflowY: 'auto' }}>
                {onlineUserDetails.map((staff) => (
                  <ListItem key={staff._id} sx={{ py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 28, height: 28 }}>
                        {staff.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={staff.name}
                      secondary={staff.role || 'Staff'}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                    <ListItemSecondaryAction>
                      {invitedUsers.includes(staff._id) ? (
                        <Chip label="Invited" size="small" color="success" icon={<CheckIcon />} />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleInviteStaff(staff._id, staff.name)}
                        >
                          Invite
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* ─── Jitsi container ──────────────────────────────────── */}
          <Box
            ref={jitsiContainerRef}
            sx={{
              width: '100%',
              height: { xs: '300px', sm: '450px', md: '500px' },
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

      {/* ─── Incoming invite snackbar ──────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={30000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbar.message}
        action={
          window._pendingInvite && (
            <>
              <Button color="primary" size="small" onClick={acceptInvite}>
                Join
              </Button>
              <Button color="secondary" size="small" onClick={() => { window._pendingInvite = null; setSnackbar({ open: false, message: '' }); }}>
                Dismiss
              </Button>
            </>
          )
        }
      />
    </>
  );
};

export default VideoCall;