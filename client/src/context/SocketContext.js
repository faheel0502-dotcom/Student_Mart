import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('user:join', user.id);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('users:online', (users) => setOnlineUsers(users));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user]);

  const joinConversation = (id) => socketRef.current?.emit('conversation:join', id);
  const leaveConversation = (id) => socketRef.current?.emit('conversation:leave', id);
  const sendMessage = (data) => socketRef.current?.emit('message:send', data);
  const startTyping = (data) => socketRef.current?.emit('typing:start', data);
  const stopTyping = (data) => socketRef.current?.emit('typing:stop', data);
  const markRead = (data) => socketRef.current?.emit('messages:read', data);
  const on = (event, cb) => socketRef.current?.on(event, cb);
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping, markRead, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
