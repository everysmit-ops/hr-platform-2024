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
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useApi, useFetch } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { FileUploader } from '../components/Files/FileUploader';

interface Candidate {
  id: number;
  candidate_id: string;
  name: string;
  username: string;
  avatar?: string;
  keywords: string;
  status: 'new' | 'contacted' | 'interview' | 'hired' | 'rejected';
  found_date: string;
  chat: string;
  message_link: string;
  message_text: string;
  contacts?: string;
  comments_count: number;
}

interface Comment {
  id: number;
  text: string;
  author: string;
  user_id: number;
  created_at: string;
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [fileUploaderOpen, setFileUploaderOpen] = useState(false);

  const api = useApi();

  const { data: candidate, isLoading, isError, error, refetch } = useFetch<Candidate>(
    ENDPOINTS.CANDIDATE_DETAIL(Number(id)),
    { autoFetch: true }
  );

  useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id]);

  const fetchComments = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.CANDIDATE_COMMENTS(Number(id)), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success && result.data) {
      setComments(result.data as Comment[]);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const result = await api.execute(
      fetch(ENDPOINTS.CANDIDATE_STATUS(Number(id)), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Статус обновлен!',
        severity: 'success',
      });
      refetch();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;

    const result = await api.execute(
      fetch(ENDPOINTS.CANDIDATE_COMMENTS(Number(id)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: newComment }),
      })
    );

    if (result.success) {
      setNewComment('');
      fetchComments();
      setSnackbar({
        open: true,
        message: 'Комментарий добавлен!',
        severity: 'success',
      });
    }
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

  if (isLoading) {
    return <LoadingState type="card" />;
  }

  if (isError || !candidate) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки"
        message="Не удалось загрузить информацию о кандидате"
        onRetry={refetch}
      />
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
                    {candidate.name?.[0] || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      {candidate.name || 'Без имени'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      @{candidate.username || 'нет username'}
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
                  onClick={() => window.open(candidate.message_link, '_blank')}
                  sx={{ borderRadius: 2 }}
                >
                  Открыть сообщение
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={() => setFileUploaderOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Файлы
                </Button>
              </Stack>

              {/* Детали */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ключевые слова
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {candidate.keywords?.split(',').map((kw, i) => (
                      <Chip key={i} label={kw.trim()} />
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
                    {candidate.chat || 'Не указан'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Дата добавления
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {new Date(candidate.found_date).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {/* Текст сообщения */}
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 3 }}>
                Текст сообщения
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {candidate.message_text || 'Нет текста сообщения'}
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
                <CommentIcon /> Комментарии ({comments.length})
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
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <Paper key={comment.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">{comment.author}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.created_at).toLocaleString()}
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

      {/* File uploader dialog */}
      {candidate && (
        <FileUploader
          open={fileUploaderOpen}
          onClose={() => setFileUploaderOpen(false)}
          candidateId={candidate.id}
          onUploadSuccess={() => {
            // Можно обновить информацию о кандидате если нужно
          }}
        />
      )}
    </Box>
  );
}
