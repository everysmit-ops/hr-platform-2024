import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  TextField,
  Avatar,
  Paper,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';

interface Candidate {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  keywords: string[];
  status: 'new' | 'contacted' | 'interview' | 'hired' | 'rejected';
  foundDate: string;
  chat: string;
  messageLink: string;
  text: string;
  contacts?: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  text: string;
  author: string;
  createdAt: string;
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    // Мок-данные для тестирования
    const mockCandidate: Candidate = {
      id: id || '1',
      name: 'Иван Петров',
      username: 'ivan_petrov',
      keywords: ['python', 'django', 'sql'],
      status: 'new',
      foundDate: new Date().toISOString(),
      chat: 'Python Job Chat',
      messageLink: 'https://t.me/test/123',
      text: 'Ищу работу Python разработчиком. Опыт 3 года, стек: Django, FastAPI, PostgreSQL.',
      contacts: 'ivan@mail.ru',
      comments: [
        {
          id: 1,
          text: 'Позвонил, договорились на собеседование',
          author: 'Анна',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    
    setCandidate(mockCandidate);
    setLoading(false);
  }, [id]);

  const handleStatusChange = (newStatus: string) => {
    if (candidate) {
      setCandidate({ ...candidate, status: newStatus as any });
      setSnackbar({
        open: true,
        message: 'Статус обновлен!',
        severity: 'success',
      });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !candidate) return;
    
    const newCommentObj: Comment = {
      id: Date.now(),
      text: newComment,
      author: 'Вы',
      createdAt: new Date().toISOString(),
    };
    
    setCandidate({
      ...candidate,
      comments: [...(candidate.comments || []), newCommentObj],
    });
    
    setNewComment('');
    setSnackbar({
      open: true,
      message: 'Комментарий добавлен!',
      severity: 'success',
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: 'info' | 'warning' | 'secondary' | 'success' | 'error', label: string }> = {
      new: { color: 'info', label: '🆕 Новый' },
      contacted: { color: 'warning', label: '📞 Связались' },
      interview: { color: 'secondary', label: '📅 Интервью' },
      hired: { color: 'success', label: '🎯 Нанят' },
      rejected: { color: 'error', label: '❌ Отказ' },
    };
    
    const config = statusConfig[status] || statusConfig.new;
    return <Chip label={config.label} color={config.color} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Кандидат не найден</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок с кнопкой назад */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/candidates')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Карточка кандидата
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar
                    sx={{ width: 80, height: 80, bgcolor: '#2481cc' }}
                    src={candidate.avatar}
                  >
                    {candidate.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      {candidate.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      @{candidate.username}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {getStatusChip(candidate.status)}
                    </Box>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Редактировать
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Быстрые действия */}
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Быстрые действия
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleStatusChange('contacted')}
                  sx={{ borderRadius: 2 }}
                >
                  Связался
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ScheduleIcon />}
                  onClick={() => handleStatusChange('interview')}
                  sx={{ borderRadius: 2 }}
                >
                  Интервью
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleStatusChange('hired')}
                  sx={{ borderRadius: 2 }}
                >
                  Нанят
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => handleStatusChange('rejected')}
                  sx={{ borderRadius: 2 }}
                >
                  Отказ
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => window.open(candidate.messageLink, '_blank')}
                  sx={{ borderRadius: 2 }}
                >
                  Открыть сообщение
                </Button>
              </Stack>

              {/* Детали */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ключевые слова
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {candidate.keywords.map((kw, i) => (
                      <Chip key={i} label={kw} />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Контакты
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {candidate.contacts || 'Не указаны'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Чат
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {candidate.chat}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Дата добавления
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {new Date(candidate.foundDate).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {/* Текст сообщения */}
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 3 }}>
                Текст сообщения
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {candidate.text}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Правая колонка */}
        <Grid item xs={12} md={4}>
          {/* Комментарии */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon /> Комментарии ({candidate.comments?.length || 0})
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Добавить комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <IconButton size="small" onClick={handleAddComment} color="primary">
                  <SendIcon />
                </IconButton>
              </Box>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {candidate.comments && candidate.comments.length > 0 ? (
                  candidate.comments.map((comment) => (
                    <Paper key={comment.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">{comment.author}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{comment.text}</Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Пока нет комментариев
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar для уведомлений */}
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
