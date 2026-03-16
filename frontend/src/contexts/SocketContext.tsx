import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notify: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  notify: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Создаем подключение к Socket.IO серверу
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Аутентифицируемся
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          newSocket.emit('authenticate', { user_id: user.id });
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated', data);
    });

    // Обработчики различных уведомлений
    newSocket.on('new_candidate', (data) => {
      console.log('New candidate notification:', data);
      // Здесь можно показать уведомление
    });

    newSocket.on('status_change', (data) => {
      console.log('Status change notification:', data);
    });

    newSocket.on('new_message', (data) => {
      console.log('New message notification:', data);
    });

    newSocket.on('task_assigned', (data) => {
      console.log('Task assigned notification:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const notify = (event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, notify }}>
      {children}
    </SocketContext.Provider>
  );
};


