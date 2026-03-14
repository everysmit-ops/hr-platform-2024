import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Scout {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  total: number;
  hired: number;
  interviewed: number;
  conversion: number;
  kpi_progress: number;
  rank: number;
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('week');

  const { data: scouts, isLoading, isError, error, refetch } = useFetch<Scout[]>(
    `${ENDPOINTS.LEADERBOARD}?period=${period}`,
    { 
      autoFetch: true,
      initialData: [] 
    }
  );

  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: string,
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
      refetch();
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#9e9e9e';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (isLoading) {
    return <LoadingState type="list" count={5} />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки топа"
        message="Не удалось загрузить топ лидеров"
        onRetry={refetch}
      />
    );
  }

  const scoutsArray = Array.isArray(scouts) ? scouts : [];
  const topScouts = scoutsArray.slice(0, 3);
  const restScouts = scoutsArray.slice(3);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          🏆 Топ лидеров
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="day">День</ToggleButton>
          <ToggleButton value="week">Неделя</ToggleButton>
          <ToggleButton value="month">Месяц</ToggleButton>
          <ToggleButton value="year">Год</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {topScouts.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {topScouts.map((scout, index) => (
            <Grid item xs={12} md={4} key={scout.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'visible',
                  transform: index === 0 ? 'scale(1.05)' : 'none',
                  zIndex: index === 0 ? 2 : 1,
                  boxShadow: index === 0 ? '0 8px 24px rgba(0,0,0,0.15)' : 1,
                }}
              >
                {index === 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#FFD700',
                      color: '#000',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    👑 Лидер
                  </Box>
                )}
                <CardContent sx={{ textAlign: 'center', pt: index === 0 ? 4 : 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      border: `4px solid ${getRankColor(index + 1)}`,
                      boxShadow: 2,
                    }}
                    src={scout.avatar}
                  >
                    {scout.name?.[0] || '?'}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {scout.name || 'Без имени'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    @{scout.username || 'нет username'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<PersonIcon />}
                      label={`${scout.total || 0} кандидатов`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<StarIcon />}
                      label={`${scout.hired || 0} наймов`}
                      size="small"
                      color="success"
                    />
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {getRankIcon(index + 1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Конверсия: {scout.conversion || 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {scoutsArray.length > 0 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              📊 Полная таблица
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Место</TableCell>
                    <TableCell>Скаут</TableCell>
                    <TableCell align="center">Кандидаты</TableCell>
                    <TableCell align="center">Интервью</TableCell>
                    <TableCell align="center">Наймы</TableCell>
                    <TableCell align="center">Конверсия</TableCell>
                    <TableCell align="center">KPI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {restScouts.map((scout) => (
                    <TableRow key={scout.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: getRankColor(scout.rank),
                              color: scout.rank <= 3 ? '#000' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 14,
                            }}
                          >
                            {scout.rank}
                          </Typography>
                          {scout.rank <= 3 && <TrophyIcon sx={{ color: getRankColor(scout.rank) }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={scout.avatar} sx={{ width: 32, height: 32 }}>
                            {scout.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {scout.name || 'Без имени'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{scout.username || 'нет username'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{scout.total || 0}</TableCell>
                      <TableCell align="center">{scout.interviewed || 0}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={scout.hired || 0}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={scout.conversion || 0}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">{scout.conversion || 0}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={scout.kpi_progress || 0}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                            color={scout.kpi_progress >= 100 ? 'success' : 'primary'}
                          />
                          <Typography variant="caption">{scout.kpi_progress || 0}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {scoutsArray.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Нет данных для отображения
          </Typography>
        </Box>
      )}
    </Box>
  );
}
