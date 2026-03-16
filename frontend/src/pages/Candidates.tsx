import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  EmojiEvents as SuccessIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Candidate {
  id: number;
  candidate_id: string;
  name: string;
  username: string;
  keywords: string;
  status: 'new' | 'approved' | 'rejected' | 'interview_scheduled' | 'candidate_rejected' | 'partner_rejected' | 'registered' | 'successful';
  interview_date?: string;
  shifts_completed: number;
  is_successful: boolean;
  found_date: string;
  chat: string;
  message_link: string;
  message_text: string;
  contacts: string;
  comments_count: number;
  scout_name?: string;
  rejection_reason?: string;
  status_history?: any[];
}

const statusColors: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  new: { bg: '#e3f2fd', color: '#1976d2', label: '🆕 Новый', icon: <PendingIcon /> },
  approved: { bg: '#e8f5e8', color: '#2e7d32', label: '✅ Анкета одобрена', icon: <CheckCircleIcon /> },
  rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Анкета отказана', icon: <CancelIcon /> },
  interview_scheduled: { bg: '#fff3e0', color: '#ed6c02', label: '📅 Назначено собеседование', icon: <ScheduleIcon /> },
  candidate_rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Отказ кандидата', icon: <CancelIcon /> },
  partner_rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Отказ партнера', icon: <CancelIcon /> },
  registered: { bg: '#e8f5e8', color: '#2e7d32', label: '📝 Регистрация', icon: <CheckCircleIcon /> },
  successful: { bg: '#fff3e0', color: '#ed6c02', label: '🏆 Успешно', icon: <SuccessIcon /> },
};

export default function Candidates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openInterviewDialog, setOpenInterviewDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    username: '',
    keywords: '',
    chat: '',
    message_link: '',
    message_text: '',
    contacts: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const api = useApi();

  const { data: candidates, isLoading, isError, error, refetch } = useFetch<Candidate[]>(
    `${ENDPOINTS.CANDIDATES}?status=${statusFilter === 'all' ? '' : statusFilter}`,
    { autoFetch: true, initialData: [] }
  );

  const { data: successfulCandidates } = useFetch<Candidate[]>(
    ENDPOINTS.SUCCESSFUL_CANDIDATES,
    { autoFetch: true, initialData: [] }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const statusMap = ['all', 'new', 'approved', 'rejected', 'interview_scheduled', 'candidate_rejected', 'partner_rejected', 'registered', 'successful'];
    setStatusFilter(statusMap[newValue]);
  };

  const handleCreateCandidate = async () => {
    setCreateError(null);
    
    const result = await api.execute(
      fetch(ENDPOINTS.CREATE_CANDIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newCandidate),
      })
    );

    if (result.success) {
      setOpenCreateDialog(false);
      setNewCandidate({
        name: '',
        username: '',
        keywords: '',
        chat: '',
        message_link: '',
        message_text: '',
        contacts: '',
      });
      refetch();
    } else {
      setCreateError(result.error || 'Ошибка при создании анкеты');
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate || !interviewDate) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.CANDIDATE_INTERVIEW(selectedCandidate.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ interview_date: interviewDate }),
      })
    );

    if (result.success) {
      setOpenInterviewDialog(false);
      setSelectedCandidate(null);
      setInterviewDate('');
      refetch();
    }
  };

  const handleUpdateShifts = async (candidateId: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.CANDIDATE_SHIFTS(candidateId)}`, {
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

  const filteredCandidates = Array.isArray(candidates) 
    ? candidates.filter((c: Candidate) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          c.name?.toLowerCase().includes(searchLower) ||
          (c.keywords && c.keywords.toLowerCase().includes(searchLower))
        );
      })
    : [];

  const sortedCandidates = [...filteredCandidates].sort((a: Candidate, b: Candidate) => {
    if (sortBy === 'date') {
      return new Date(b.found_date).getTime() - new Date(a.found_date).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.found_date).getTime() - new Date(b.found_date).getTime();
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    if (sortBy === 'shifts') {
      return (b.shifts_completed || 0) - (a.shifts_completed || 0);
    }
    return 0;
  });

  const paginatedCandidates = sortedCandidates.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusChip = (status: string, shifts?: number) => {
    const config = statusColors[status] || statusColors.new;
    return (
      <Box>
        <Chip
          icon={config.icon}
          label={config.label}
          size="small"
          sx={{
            backgroundColor: config.bg,
            color: config.color,
            fontWeight: 500,
          }}
        />
        {status === 'successful' && shifts && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: config.color }}>
            Смен: {shifts}
          </Typography>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return <LoadingState type="list" count={5} />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки кандидатов"
        message="Не удалось загрузить список кандидатов"
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          👥 Кандидаты
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Создать анкету
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {candidates?.length || 0}
          </Typography>
          <Typography variant="body2">Всего кандидатов</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {successfulCandidates?.length || 0}
          </Typography>
          <Typography variant="body2">Успешных (2+ смены)</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {candidates?.filter(c => c.status === 'new').length || 0}
          </Typography>
          <Typography variant="body2">На модерации</Typography>
        </Card>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Все" />
        <Tab label="🆕 Новые" />
        <Tab label="✅ Одобрено" />
        <Tab label="❌ Отказано" />
        <Tab label="📅 Собеседование" />
        <Tab label="❌ Отказ кандидата" />
        <Tab label="❌ Отказ партнера" />
        <Tab label="📝 Регистрация" />
        <Tab label="🏆 Успешные" />
      </Tabs>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Поиск по имени или навыкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={sortBy}
              label="Сортировка"
              onChange={(e) => setSortBy(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="date">По дате ↓</MenuItem>
              <MenuItem value="date_asc">По дате ↑</MenuItem>
              <MenuItem value="name">По имени</MenuItem>
              <MenuItem value="status">По статусу</MenuItem>
              <MenuItem value="shifts">По сменам</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            sx={{ height: '56px', borderRadius: 2 }}
          >
            Фильтры
          </Button>
        </Grid>
      </Grid>

      {!paginatedCandidates || paginatedCandidates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Кандидаты не найдены
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedCandidates.map((candidate: Candidate) => (
              <Grid item xs={12} key={candidate.id}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{ width: 48, height: 48, bgcolor: '#2481cc' }}
                          >
                            {candidate.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {candidate.name || 'Без имени'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {candidate.username ? `@${candidate.username}` : 'нет username'}
                            </Typography>
                            {candidate.scout_name && (
                              <Typography variant="caption" color="primary">
                                Скаут: {candidate.scout_name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {candidate.keywords?.split(',').slice(0, 3).map((kw: string, i: number) => (
                            <Chip
                              key={i}
                              label={kw.trim()}
                              size="small"
                              sx={{ backgroundColor: '#e0e0e0' }}
                            />
                          ))}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        {getStatusChip(candidate.status, candidate.shifts_completed)}
                        {candidate.interview_date && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            📅 {new Date(candidate.interview_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(candidate.found_date).toLocaleDateString()}
                          </Typography>
                          {candidate.status === 'registered' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateShifts(candidate.id);
                              }}
                            >
                              + Смена
                            </Button>
                          )}
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (candidate.message_link) {
                                window.open(candidate.message_link, '_blank');
                              }
                            }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {sortedCandidates.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(sortedCandidates.length / itemsPerPage)}
                page={page}
                onChange={(e: React.ChangeEvent<unknown>, value: number) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Диалог создания анкеты */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создание новой анкеты</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Имя *"
                fullWidth
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Telegram Username"
                fullWidth
                value={newCandidate.username}
                onChange={(e) => setNewCandidate({ ...newCandidate, username: e.target.value })}
                placeholder="@username"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ключевые слова"
                fullWidth
                value={newCandidate.keywords}
                onChange={(e) => setNewCandidate({ ...newCandidate, keywords: e.target.value })}
                placeholder="python, django, sql"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Название чата"
                fullWidth
                value={newCandidate.chat}
                onChange={(e) => setNewCandidate({ ...newCandidate, chat: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ссылка на сообщение"
                fullWidth
                value={newCandidate.message_link}
                onChange={(e) => setNewCandidate({ ...newCandidate, message_link: e.target.value })}
                placeholder="https://t.me/..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Текст сообщения"
                fullWidth
                multiline
                rows={3}
                value={newCandidate.message_text}
                onChange={(e) => setNewCandidate({ ...newCandidate, message_text: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Контакты"
                fullWidth
                value={newCandidate.contacts}
                onChange={(e) => setNewCandidate({ ...newCandidate, contacts: e.target.value })}
                placeholder="Email, телефон и т.д."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleCreateCandidate} 
            variant="contained"
            disabled={!newCandidate.name}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог назначения собеседования */}
      <Dialog open={openInterviewDialog} onClose={() => setOpenInterviewDialog(false)}>
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
          <Button onClick={() => setOpenInterviewDialog(false)}>Отмена</Button>
          <Button onClick={handleScheduleInterview} variant="contained">
            Назначить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
