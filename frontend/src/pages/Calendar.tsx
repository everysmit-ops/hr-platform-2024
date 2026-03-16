import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ENDPOINTS } from '../config';

interface Interview {
  id: number;
  candidate_id: number;
  candidate_name: string;
  scout_id: number;
  date: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [newInterview, setNewInterview] = useState({
    candidate_id: '',
    date: '',
    notes: '',
  });

  const api = useApi();

  const { data: interviews, isLoading, isError, error, refetch } = useFetch<Interview[]>(
    `${ENDPOINTS.BASE_URL}/api/interviews`,
    { autoFetch: true, initialData: [] }
  );

  const { data: candidatesokes, isLoading: candidatesLoading } = useFetch<any[]>(
    ENDPOINTS.CANDIDATES,
    { autoFetch: true, initialData: [] }
  );

  const handleCreateInterview = async () => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newInterview),
      })
    );

    if (result.success) {
      setOpenDialog(false);
      setNewInterview({ candidate_id: '', date: '', notes: '' });
      refetch();
    }
  };

  const handleUpdateInterview = async () => {
    if (!selectedInterview) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.BASE_URL}/api/interviews/${selectedInterview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(selectedInterview),
      })
    );

    if (result.success) {
      setSelectedInterview(null);
      refetch();
    }
  };

  const handleDeleteInterview = async (id: number) => {
    if (!window.confirm('Удалить собеседование?')) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.BASE_URL}/api/interviews/${id}`, {
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

  const getInterviewsForDate = (date: Date) => {
    if (!interviews) return [];
    return interviews.filter(i => 
      new Date(i.date).toDateString() === date.toDateString()
    );
  };

  if (isLoading || candidatesLoading) {
    return <LoadingState type="card" />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки"
        message="Не удалось загрузить календарь"
        onRetry={refetch}
      />
    );
  }

  const dailyInterviews = selectedDate ? getInterviewsForDate(selectedDate) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          📅 Календарь собеседований
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Назначить собеседование
        </Button>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <DatePicker
                label="Выберите дату"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 }
                  }
                }}
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Собеседования на {selectedDate?.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Typography>
                
                {dailyInterviews.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Нет запланированных собеседований
                  </Typography>
                ) : (
                  dailyInterviews.map((interview) => (
                    <Card key={interview.id} sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box>
                            <Typography variant="h6">
                              {interview.candidate_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Время: {new Date(interview.date).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            {interview.notes && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {interview.notes}
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <Chip
                              label={
                                interview.status === 'scheduled' ? 'Запланировано' :
                                interview.status === 'completed' ? 'Проведено' : 'Отменено'
                              }
                              color={
                                interview.status === 'scheduled' ? 'primary' :
                                interview.status === 'completed' ? 'success' : 'error'
                              }
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => setSelectedInterview(interview)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteInterview(interview.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Статистика
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Всего собеседований: {interviews?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Запланировано: {interviews?.filter(i => i.status === 'scheduled').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Проведено: {interviews?.filter(i => i.status === 'completed').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Отменено: {interviews?.filter(i => i.status === 'cancelled').length || 0}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </LocalizationProvider>

      {/* Диалог создания собеседования */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить собеседование</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Кандидат</InputLabel>
            <Select
              value={newInterview.candidate_id}
              label="Кандидат"
              onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
            >
              {candidatesokes?.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Дата и время"
            type="datetime-local"
            fullWidth
            value={newInterview.date}
            onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Заметки"
            fullWidth
            multiline
            rows={3}
            value={newInterview.notes}
            onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleCreateInterview} 
            variant="contained"
            disabled={!newInterview.candidate_id || !newInterview.date}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog 
        open={!!selectedInterview} 
        onClose={() => setSelectedInterview(null)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Редактировать собеседование</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={selectedInterview?.status || ''}
              label="Статус"
              onChange={(e) => setSelectedInterview({ 
                ...selectedInterview!, 
                status: e.target.value as any 
              })}
            >
              <MenuItem value="scheduled">Запланировано</MenuItem>
              <MenuItem value="completed">Проведено</MenuItem>
              <MenuItem value="cancelled">Отменено</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Заметки"
            fullWidth
            multiline
            rows={3}
            value={selectedInterview?.notes || ''}
            onChange={(e) => setSelectedInterview({ ...selectedInterview!, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInterview(null)}>Отмена</Button>
          <Button onClick={handleUpdateInterview} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
