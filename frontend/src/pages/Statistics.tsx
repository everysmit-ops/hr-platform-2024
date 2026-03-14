import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface StatsData {
  total: number;
  hired: number;
  interviewed: number;
  contacted: number;
  status_stats: {
    new: number;
    contacted: number;
    interview: number;
    hired: number;
    rejected: number;
  };
  conversion: {
    to_contact: number;
    to_interview: number;
    to_hire: number;
    overall: number;
  };
  daily_stats: Array<{
    date: string;
    count: number;
  }>;
  status_distribution: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ['#1976d2', '#ed6c02', '#9c27b0', '#2e7d32', '#d32f2f'];

export default function Statistics() {
  const [period, setPeriod] = useState('week');

  const { data: stats, isLoading, isError, error, refetch } = useFetch<StatsData>(
    `${ENDPOINTS.STATISTICS}?period=${period}`,
    { autoFetch: true }
  );

  const getPeriodLabel = (p: string) => {
    const labels: Record<string, string> = {
      day: 'сегодня',
      week: 'эту неделю',
      month: 'этот месяц',
      year: 'этот год',
    };
    return labels[p] || p;
  };

  if (isLoading) {
    return <LoadingState type="card" count={3} />;
  }

  if (isError || !stats) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки статистики"
        message="Не удалось загрузить статистику"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          📊 Статистика
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Период</InputLabel>
            <Select
              value={period}
              label="Период"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="day">День</MenuItem>
              <MenuItem value="week">Неделя</MenuItem>
              <MenuItem value="month">Месяц</MenuItem>
              <MenuItem value="year">Год</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
          <IconButton color="primary">
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2">Всего кандидатов</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.hired}
                  </Typography>
                  <Typography variant="body2">Наймов</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.interviewed}
                  </Typography>
                  <Typography variant="body2">Интервью</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.status_stats.rejected}
                  </Typography>
                  <Typography variant="body2">Отказов</Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📈 Воронка конверсии за {getPeriodLabel(period)}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Новые → Связались</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {stats.conversion.to_contact}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.conversion.to_contact}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Связались → Интервью</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {stats.conversion.to_interview}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.conversion.to_interview}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Интервью → Найм</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {stats.conversion.to_hire}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.conversion.to_hire}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Общая конверсия</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {stats.conversion.overall}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.conversion.overall}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="success"
                    />
                  </Box>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {stats.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📅 Динамика за {getPeriodLabel(period)}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#1976d2" name="Кандидаты" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
