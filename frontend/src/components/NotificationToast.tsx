import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
} from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
  duration?: number;
}

export const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewCandidate = (data: any) => {
      addNotification({
        message: `Новый кандидат: ${data.name || 'неизвестно'}`,
        severity: 'info',
      });
    };

    const handleStatusChange = (data: any) => {
      addNotification({
        message: `Статус кандидата изменен на ${data.new_status}`,
        severity: 'success',
      });
    };

    const handleNewMessage = (data: any) => {
      addNotification({
        message: `Новое сообщение от ${data.from_name || 'пользователя'}`,
        severity: 'info',
      });
    };

    const handleTaskAssigned = (data: any) => {
      addNotification({
        message: `Новая задача: ${data.title}`,
        severity: 'warning',
      });
    };

    socket.on('new_candidate', handleNewCandidate);
    socket.on('status_change', handleStatusChange);
    socket.on('new_message', handleNewMessage);
    socket.on('task_assigned', handleTaskAssigned);

    return () => {
      socket.off('new_candidate', handleNewCandidate);
      socket.off('status_change', handleStatusChange);
      socket.off('new_message', handleNewMessage);
      socket.off('task_assigned', handleTaskAssigned);
    };
  }, [socket]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Если сейчас нет активного уведомления, показываем новое
    if (!currentNotification) {
      setCurrentNotification({ ...notification, id });
      setOpen(true);
    }
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    
    // После закрытия показываем следующее уведомление
    setTimeout(() => {
      if (notifications.length > 0) {
        const [first, ...rest] = notifications;
        setCurrentNotification(first);
        setNotifications(rest);
        setOpen(true);
      } else {
        setCurrentNotification(null);
      }
    }, 300);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={currentNotification?.duration || 5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {currentNotification ? (
        <Alert
          onClose={handleClose}
          severity={currentNotification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {currentNotification.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};
