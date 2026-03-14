import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  created_by: number;
  created_at: string;
  completed_at?: string;
}

export default function Tasks() {
  const [filter, setFilter] = useState('pending');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
  });

  const navigate = useNavigate();
  const api = useApi();

  const { data: tasks, isLoading, isError, error, refetch } = useFetch<Task[]>(
    `${ENDPOINTS.TASKS}?status=${filter}`,
    { autoFetch: true, initialData: [] }
  );

  const handleCompleteTask = async (taskId: number) => {
    const result = await api.execute(
      fetch(ENDPOINTS.TASK_COMPLETE(taskId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Задача выполнена!',
        severity: 'success',
      });
      refetch();
    }
  };

  const handleCreateTask = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.TASKS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...newTask,
          assigned_to: 1,
        }),
      })
    );

    if (result.success) {
      setOpenDialog(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'medium' });
      setSnackbar({
        open: true,
        message: 'Задача создана!',
        severity: 'success',
      });
      refetch();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
    return labels[priority as keyof typeof labels] || priority;
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return <LoadingState type="list" count={5} />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки задач"
        message="Не удалось загрузить список задач"
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          ✅ Задачи
        </Typography>
        <Box>
          <IconButton onClick={() => refetch()} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Новая задача
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 1, mb: 3, display: 'flex', gap: 1 }} variant="outlined">
        <Chip
          label="Активные"
          onClick={() => setFilter('pending')}
          color={filter === 'pending' ? 'primary' : 'default'}
          variant={filter === 'pending' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Выполненные"
          onClick={() => setFilter('completed')}
          color={filter === 'completed' ? 'success' : 'default'}
          variant={filter === 'completed' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Все"
          onClick={() => setFilter('all')}
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
        />
      </Paper>

      {!tasks || tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Задачи не найдены
          </Typography>
        </Box>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <IconButton
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={task.status === 'completed'}
                  sx={{ mr: 1 }}
                >
                  {task.status === 'completed' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <UncheckedIcon />
                  )}
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Box>
                      <Chip
                        icon={<FlagIcon />}
                        label={getPriorityLabel(task.priority)}
                        size="small"
                        color={getPriorityColor(task.priority) as any}
                        sx={{ mr: 1 }}
                      />
                      {isOverdue(task.deadline) && task.status !== 'completed' && (
                        <Chip
                          icon={<ScheduleIcon />}
                          label="Просрочено"
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Срок: {new Date(task.deadline).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.status === 'completed' 
                        ? `Выполнено: ${new Date(task.completed_at!).toLocaleDateString()}`
                        : `Создано: ${new Date(task.created_at).toLocaleDateString()}`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание новой задачи</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название задачи"
            fullWidth
            variant="outlined"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Срок выполнения"
            type="date"
            fullWidth
            variant="outlined"
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={newTask.priority}
              label="Приоритет"
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!newTask.title}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

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
