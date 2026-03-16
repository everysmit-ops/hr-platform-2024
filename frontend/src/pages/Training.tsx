import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  PlayCircle as PlayIcon,
  Lock as LockIcon,
  Timeline as TimelineIcon,
  MenuBook as BookIcon,
  VideoLibrary as VideoIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Training {
  id: number;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  is_mandatory: boolean;
  order: number;
  author_name: string;
  created_at: string;
}

interface UserTraining {
  id: number;
  training_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  training_title: string;
  training_description: string;
}

export default function Training() {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [hasAccess, setHasAccess] = useState(true);
  
  const navigate = useNavigate();
  const api = useApi();

  const { data: trainings, isLoading: trainingsLoading, refetch: refetchTrainings } = useFetch<Training[]>(
    ENDPOINTS.TRAININGS,
    { autoFetch: true, initialData: [] }
  );

  const { data: myTrainings, isLoading: myLoading, refetch: refetchMy } = useFetch<UserTraining[]>(
    ENDPOINTS.MY_TRAININGS,
    { autoFetch: true, initialData: [] }
  );

  const { data: accessCheck } = useFetch<{ has_access: boolean; message: string }>(
    ENDPOINTS.TRAINING_ACCESS,
    { autoFetch: true }
  );

  useEffect(() => {
    if (accessCheck) {
      setHasAccess(accessCheck.has_access);
      if (!accessCheck.has_access) {
        setSnackbar({
          open: true,
          message: accessCheck.message,
          severity: 'warning',
        });
      }
    }
  }, [accessCheck]);

  const handleStartTraining = async (trainingId: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.TRAININGS}/${trainingId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetchMy();
      setSnackbar({
        open: true,
        message: 'Обучение начато!',
        severity: 'success',
      });
    }
  };

  const handleCompleteTraining = async (trainingId: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.TRAININGS}/${trainingId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetchMy();
      refetchTrainings();
      setSnackbar({
        open: true,
        message: 'Обучение завершено!',
        severity: 'success',
      });

      if (result.data?.all_mandatory_completed) {
        setSnackbar({
          open: true,
          message: 'Поздравляем! Вы прошли все обязательные обучения. Теперь вам доступен полный функционал!',
          severity: 'success',
        });
      }
    }
  };

  const getTrainingStatus = (trainingId: number) => {
    const userTraining = myTrainings?.find(ut => ut.training_id === trainingId);
    return userTraining?.status || 'pending';
  };

  const isCompleted = (trainingId: number) => {
    return getTrainingStatus(trainingId) === 'completed';
  };

  const isInProgress = (trainingId: number) => {
    return getTrainingStatus(trainingId) === 'in_progress';
  };

  const getProgress = () => {
    if (!trainings || !myTrainings) return 0;
    const mandatory = trainings.filter(t => t.is_mandatory);
    if (mandatory.length === 0) return 100;
    const completed = mandatory.filter(t => isCompleted(t.id)).length;
    return (completed / mandatory.length) * 100;
  };

  if (trainingsLoading || myLoading) {
    return <LoadingState type="card" />;
  }

  const mandatoryTrainings = trainings?.filter(t => t.is_mandatory) || [];
  const optionalTrainings = trainings?.filter(t => !t.is_mandatory) || [];
  const progress = getProgress();

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          🎓 Обучение
        </Typography>
        {!hasAccess && (
          <Chip
            icon={<LockIcon />}
            label="Доступ ограничен"
            color="warning"
          />
        )}
      </Box>

      {/* Прогресс обучения */}
      <Card sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Прогресс обучения
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Пройдено {mandatoryTrainings.filter(t => isCompleted(t.id)).length} из {mandatoryTrainings.length} обязательных курсов
          </Typography>
        </CardContent>
      </Card>

      {/* Обязательные курсы */}
      {mandatoryTrainings.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" /> Обязательные курсы
          </Typography>
          <Grid container spacing={2}>
            {mandatoryTrainings.map((training) => (
              <Grid item xs={12} key={training.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {training.title}
                          {isCompleted(training.id) && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Пройдено"
                              color="success"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          )}
                          {isInProgress(training.id) && (
                            <Chip
                              label="В процессе"
                              color="warning"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {training.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Chip
                            icon={<TimelineIcon />}
                            label={`${training.duration_minutes} мин`}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Автор: {training.author_name}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isCompleted(training.id) && (
                          <Button
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => {
                              setSelectedTraining(training);
                              setOpenDialog(true);
                            }}
                          >
                            {isInProgress(training.id) ? 'Продолжить' : 'Начать'}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Дополнительные курсы */}
      {optionalTrainings.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookIcon /> Дополнительные материалы
          </Typography>
          <Grid container spacing={2}>
            {optionalTrainings.map((training) => (
              <Grid item xs={12} md={6} key={training.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {training.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {training.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={<TimelineIcon />}
                        label={`${training.duration_minutes} мин`}
                        size="small"
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedTraining(training);
                          setOpenDialog(true);
                        }}
                      >
                        {isCompleted(training.id) ? 'Повторить' : 'Изучить'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Диалог с содержимым обучения */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTraining && (
          <>
            <DialogTitle>
              <Typography variant="h6">{selectedTraining.title}</Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Описание</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {selectedTraining.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {selectedTraining.video_url && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Видео-материал</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <iframe
                        src={selectedTraining.video_url}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Материалы для изучения</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedTraining.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Закрыть</Button>
              {!isCompleted(selectedTraining.id) && (
                <Button
                  variant="contained"
                  onClick={() => {
                    handleCompleteTraining(selectedTraining.id);
                    setOpenDialog(false);
                  }}
                >
                  Отметить как пройденное
                </Button>
              )}
              {!isInProgress(selectedTraining.id) && !isCompleted(selectedTraining.id) && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    handleStartTraining(selectedTraining.id);
                  }}
                >
                  Начать обучение
                </Button>
              )}
            </DialogActions>
          </>
        )}
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
}
