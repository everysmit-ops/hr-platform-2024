import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Button,
  Chip,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFetch, useApi } from '../hooks/useApi';
import { ENDPOINTS } from '../config';
import { formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const navigate = useNavigate();
  const api = useApi();

  const { data: notifications, isLoading, refetch } = useFetch<Notification[]>(
    `${ENDPOINTS.NOTIFICATIONS}?unread_only=${tabValue === 1}`,
    { autoFetch: true, initialData: [] }
  );

  const handleMarkAsRead = async (notificationId: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.NOTIFICATIONS_READ_ALL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({
        open: true,
        message: 'Все уведомления отмечены как прочитанные',
        severity: 'success',
      });
    }
  };

  const handleDelete = async (notificationId: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Удалить все уведомления?')) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.NOTIFICATIONS}/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({
        open: true,
        message: 'Все уведомления удалены',
        severity: 'success',
      });
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'high') return <WarningIcon color="warning" />;
    if (type === 'candidate_hired') return <CheckCircleIcon color="success" />;
    if (type === 'candidate_rejected') return <CancelIcon color="error" />;
    if (type === 'candidate_approved') return <CheckCircleIcon color="success" />;
    if (type === 'training') return <InfoIcon color="info" />;
    return <InfoIcon color="info" />;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          🔔 Уведомления
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ mr: 1 }}
            >
              Прочитать все
            </Button>
          )}
          {notifications && notifications.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteAll}
            >
              Очистить все
            </Button>
          )}
        </Box>
      </Box>

      {/* Вкладки */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={`Все (${notifications?.length || 0})`} />
        <Tab label={`Непрочитанные (${unreadCount})`} />
      </Tabs>

      {/* Список уведомлений */}
      {notifications && notifications.length === 0 ? (
        <Card sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {tabValue === 0 ? 'У вас нет уведомлений' : 'Нет непрочитанных уведомлений'}
          </Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <List>
              {notifications?.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => {
                      if (notification.data?.candidate_id) {
                        navigate(`/candidates/${notification.data.candidate_id}`);
                      } else if (notification.type === 'training') {
                        navigate('/training');
                      } else if (notification.type === 'referral') {
                        navigate('/referrals');
                      }
                    }}
                    secondaryAction={
                      <Box>
                        {!notification.read && (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={notification.read ? 400 : 600}>
                            {notification.title}
                          </Typography>
                          {notification.priority === 'high' && (
                            <Chip label="Важно" size="small" color="warning" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistance(new Date(notification.created_at), new Date(), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
