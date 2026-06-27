import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import api from '../api/axios'; // ✅ ADDED – was missing

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://purveyols-backend.onrender.com';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected globally');
      newSocket.emit('register', user.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err);
    });

    // ─── Listen for online users updates ──────────────────────────
    newSocket.on('online-users', (userIds) => {
      setOnlineUsers(userIds);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // ─── Fetch online user details ──────────────────────────────────
  const fetchOnlineUserDetails = async () => {
    if (!user) return [];
    try {
      const res = await api.get('/api/users/online');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch online users:', err);
      return [];
    }
  };

  const inviteToMeeting = (to, meetingLink, meetingName) => {
    if (socketRef.current) {
      socketRef.current.emit('invite-to-meeting', {
        to,
        meetingLink,
        from: user.id,
        meetingName: meetingName || 'Video Meeting',
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, fetchOnlineUserDetails, inviteToMeeting }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);