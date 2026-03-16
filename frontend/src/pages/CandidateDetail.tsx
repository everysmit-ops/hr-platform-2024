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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  LinearProgress,
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
  Check as ApproveIcon,
  Close as RejectIcon,
  Event as EventIcon,
  EmojiEvents as SuccessIcon,
  History as HistoryIcon,
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
  status: 'new' | 'approved' | 'rejected' | 'interview_scheduled' | 'candidate_rejected' | 'partner_rejected' | 'registered' | 'successful';
  interview_date?: string;
  shifts_completed: number;
  is_successful: boolean;
  found_date: string;
  chat: string;
  message_link: string;
  message_text: string;
  contacts?: string;
  comments_count: number;
  scout_name?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  status_history?: Array<{
    status: string;
    date: string;
    changed_by_name: string;
    interview_date?: string;
    rejection_reason?: string;
  }>;
}

interface Comment {
  id: number;
  text: string;
  author: string;
  user_id: number;
  created_at: string;
}

const statusColors: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  new: { bg: '#e3f2fd', color: '#1976d2', label: '🆕 Новый', icon: <ScheduleIcon /> },
  approved: { bg: '#e8f5e8', color: '#2e7d32', label: '✅ Анкета одобрена', icon: <CheckCircleIcon /> },
  rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Анкета отказана', icon: <CancelIcon /> },
  interview_scheduled: { bg: '#fff3e0', color: '#ed6c02', label: '📅 Назначено собеседование', icon: <EventIcon /> },
  candidate_rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Отказ кандидата', icon: <CancelIcon /> },
  partner_rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Отказ партнера', icon: <CancelIcon /> },
  registered: { bg: '#e8f5e8', color: '#2e7d32', label: '📝 Регистрация', icon: <CheckCircleIcon /> },
  successful: { bg: '#fff3e0', color: '#ed6c02', label: '🏆 Успешно', icon: <SuccessIcon /> },
};

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [fileUploaderOpen, setFileUploaderOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'candidate' | 'partner'>('candidate');
  const [interviewDate, setInterviewDate] = useState('');
  const [userRole, setUserRole] = useState<string>('scout');

  const api = useApi();

  const { data: candidate, isLoading, isError, error, refetch } = useFetch<Candidate>(
    ENDPOINTS.CANDIDATE_DETAIL(Number(id)),
    { autoFetch: true }
  );

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'scout');
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

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

  const handleStatusChange = async (newStatus: string, additionalData?: any) => {
    const result = await api.execute(
      fetch(ENDPOINTS.CANDIDATE_STATUS(Number(id)), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus, ...additionalData }),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Статус обновлен!',
        severity: 'success',
      });
      refetch();
      setRejectDialogOpen(false);
      setInterviewDialogOpen(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate) return;
    
    const result = await api.execute(
      fetch(`${ENDPOINTS.CANDIDATE_INTERVIEW(Number(id))}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ interview_date: interviewDate }),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Собеседование назначено!',
        severity: 'success',
      });
      refetch();
      setInterviewDialogOpen(false);
    }
  };

  const handleAddShift = async () => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.CANDIDATE_SHIFTS(Number(id))}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Смена добавлена!',
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
    const config = statusColors[status] || statusColors.new;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.9rem',
          py: 2,
        }}
      />
    );
  };

  const getStatusTimelineIcon = (status: string) => {
    switch(status) {
      case 'new': return <ScheduleIcon />;
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      case 'interview_scheduled': return <EventIcon />;
      case 'candidate_rejected': return <CancelIcon />;
      case 'partner_rejected': return <CancelIcon />;
      case 'registered': return <CheckCircleIcon />;
      case 'successful': return <SuccessIcon />;
      default: return <HistoryIcon />;
    }
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

  const isAdmin = userRole === 'admin';
  const isNew = candidate.status === 'new';
  const isRegistered = candidate.status === 'registered';
  const isSuccessful = candidate.status === 'successful';

  const nextSteps = () => {
    if (isNew && isAdmin) {
      return (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => handleStatusChange('approved')}
          >
            Одобрить
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => setRejectDialogOpen(true)}
          >
            Отклонить
          </Button>
        </Stack>
      );
    }
    if (candidate.status === 'approved') {
      return (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EventIcon />}
            onClick={() => setInterviewDialogOpen(true)}
          >
            Назначить собеседование
          </Button>
        </Stack>
      );
    }
    if (candidate.status === 'interview_scheduled') {
      return (
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleStatusChange('registered')}
          >
            Кандидат пришел
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => {
              setRejectionType('candidate');
              setRejectDialogOpen(true);
            }}
          >
            Отказ кандидата
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => {
              setRejectionType('partner');
              setRejectDialogOpen(true);
            }}
          >
            Отказ партнера
          </Button>
        </Stack>
      );
    }
    if (candidate.status === 'registered') {
      return (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<SuccessIcon />}
            onClick={handleAddShift}
          >
            Добавить смену ({candidate.shifts_completed}/2)
          </Button>
          {candidate.shifts_completed >= 2 && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<SuccessIcon />}
              onClick={() => handleStatusChange('successful')}
            >
              Подтвердить успешность
            </Button>
          )}
        </Stack>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/candidates')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={700} sx={{ flex: 1 }}>
          Карточка кандидата
        </Typography>
        {isSuccessful && (
          <Chip
            icon={<SuccessIcon />}
            label={`Успешный кандидат (${candidate.shifts_completed} смен)`}
            color="warning"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Левая колонка - основная информация */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              {/* Шапка профиля */}
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
                    {candidate.scout_name && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                        Скаут: {candidate.scout_name}
                      </Typography>
                    )}
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

              {/* Причина отказа (если есть) */}
              {candidate.rejection_reason && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Причина отказа:</Typography>
                  {candidate.rejection_reason}
                </Alert>
              )}

              {/* Дата собеседования (если есть) */}
              {candidate.interview_date && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Собеседование назначено на:</Typography>
                  {new Date(candidate.interview_date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Alert>
              )}

              {/* Прогресс для успешных */}
              {candidate.status === 'registered' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Прогресс до успешного статуса
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(candidate.shifts_completed / 2) * 100}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {candidate.shifts_completed} из 2 смен
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Следующие шаги */}
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Действия
              </Typography>
              {nextSteps()}

              {/* Детали */}
              <Grid container spacing={3} sx={{ mt: 1 }}>
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

                  {candidate.approved_at && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Дата одобрения
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {new Date(candidate.approved_at).toLocaleString()}
                      </Typography>
                    </>
                  )}
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

          {/* История статусов */}
          {candidate.status_history && candidate.status_history.length > 0 && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon /> История изменений
                </Typography>
                <Timeline position="right" sx={{ m: 0, p: 0 }}>
                  {candidate.status_history.map((event, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent sx={{ flex: 0.2, color: 'text.secondary' }}>
                        <Typography variant="caption">
                          {new Date(event.date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={
                          event.status === 'rejected' || event.status === 'candidate_rejected' || event.status === 'partner_rejected' ? 'error' :
                          event.status === 'successful' ? 'warning' :
                          event.status === 'approved' || event.status === 'registered' ? 'success' :
                          event.status === 'interview_scheduled' ? 'info' : 'grey'
                        }>
                          {getStatusTimelineIcon(event.status)}
                        </TimelineDot>
                        {index < candidate.status_history.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {statusColors[event.status]?.label || event.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {event.changed_by_name}
                        </Typography>
                        {event.interview_date && (
                          <Typography variant="caption" color="info.main" display="block">
                            📅 {new Date(event.interview_date).toLocaleDateString()}
                          </Typography>
                        )}
                        {event.rejection_reason && (
                          <Typography variant="caption" color="error.main" display="block">
                            Причина: {event.rejection_reason}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Диалог отклонения */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {rejectionType === 'candidate' ? 'Отказ кандидата' : 'Отказ партнера'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Причина отказа"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Укажите причину отказа..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => handleStatusChange(
              rejectionType === 'candidate' ? 'candidate_rejected' : 'partner_rejected',
              { rejection_reason: rejectionReason }
            )}
            variant="contained"
            color="error"
          >
            Подтвердить отказ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог назначения собеседования */}
      <Dialog open={interviewDialogOpen} onClose={() => setInterviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить собеседование</DialogTitle>
        <DialogContent>
          <TextField
            type="datetime-local"
            fullWidth
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleScheduleInterview} variant="contained" color="primary">
            Назначить
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* File uploader */}
      {candidate && (
        <FileUploader
          open={fileUploaderOpen}
          onClose={() => setFileUploaderOpen(false)}
          candidateId={candidate.id}
        />
      )}
    </Box>
  );
}
