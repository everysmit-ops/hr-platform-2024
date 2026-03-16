import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface Broadcast {
  id: number;
  title: string;
  message: string;
  author_name: string;
  sent_at: string | null;
  total_recipients: number;
  created_at: string;
}

export const BroadcastComponent: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [sending, setSending] = useState(false);

  const api = useApi();

  const { data: broadcasts, isLoading, refetch } = useFetch<Broadcast[]>(
    ENDPOINTS.BROADCAST_HISTORY,
    { autoFetch: showHistory, initialData: [] }
  );

  const handleSend = async () => {
    setSending(true);
    const result = await api.execute(
      fetch(ENDPOINTS.BROADCAST_SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          confirm: true,
        }),
      })
    );

    setSending(false);

    if (result.success) {
      setOpenDialog(false);
      setFormData({ title: '', message: '' });
      setSnackbar({
        open: true,
        message: 'Рассылка запущена! Сообщения будут доставлены в течение нескольких минут.',
        severity: 'success',
      });
      if (showHistory) {
        refetch();
      }
    } else {
      setSnackbar({
        open: true,
        message: result.error || 'Ошибка при отправке рассылки',
        severity: 'error',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не отправлено';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Заголовок */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        📢 Рассылки
      </Typography>

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setOpenDialog(true)}
              size="large"
              sx={{ flex: 1 }}
            >
              Создать рассылку
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowHistory(!showHistory)}
              size="large"
            >
              {showHistory ? 'Скрыть историю' : 'История рассылок'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* История рассылок */}
      {showHistory && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              История рассылок
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : broadcasts && broadcasts.length > 0 ? (
              <List>
                {broadcasts.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={item.sent_at ? 'Отправлено' : 'В процессе'}
                              color={item.sent_at ? 'success' : 'warning'}
                              icon={item.sent_at ? <CheckCircleIcon /> : <ScheduleIcon />}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.primary" paragraph>
                              {item.message}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                От: {item.author_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Создано: {formatDate(item.created_at)}
                              </Typography>
                              {item.sent_at && (
                                <Typography variant="caption" color="text.secondary">
                                  Отправлено: {formatDate(item.sent_at)}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Получателей: {item.total_recipients}
                              </Typography>
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                История рассылок пуста
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог создания рассылки */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание новой рассылки</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Сообщение будет отправлено всем активным пользователям бота.
          </Alert>
          
          <TextField
            autoFocus
            margin="dense"
            label="Тема рассылки"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Текст сообщения"
            fullWidth
            multiline
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Введите текст сообщения..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleSend} 
            variant="contained"
            disabled={!formData.title || !formData.message || sending}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
