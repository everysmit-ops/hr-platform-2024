import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Scout {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  role: string;
  total_candidates: number;
  total_hired: number;
  kpi_target: number;
  kpi_current: number;
  registered_at: string;
  is_active: boolean;
}

interface AdminStats {
  total_candidates: number;
  total_hired: number;
  total_scouts: number;
  conversion_rate: number;
  status_distribution: {
    new: number;
    contacted: number;
    interviewed: number;
    hired: number;
    rejected: number;
  };
}

export default function AdminPanel() {
  const [tabValue, setTabValue] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newScout, setNewScout] = useState({
    telegram_id: '',
    first_name: '',
    role: 'scout',
    kpi_target: 5,
  });

  const api = useApi();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useFetch<AdminStats>(
    ENDPOINTS.ADMIN_STATS,
    { autoFetch: tabValue === 0 }
  );

  const { data: scouts, isLoading: scoutsLoading, refetch: refetchScouts } = useFetch<Scout[]>(
    ENDPOINTS.ADMIN_SCOUTS,
    { autoFetch: tabValue === 1, initialData: [] }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddScout = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.ADMIN_SCOUTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          telegram_id: parseInt(newScout.telegram_id),
          first_name: newScout.first_name,
          role: newScout.role,
        }),
      })
    );

    if (result.success) {
      setOpenAddDialog(false);
      setNewScout({ telegram_id: '', first_name: '', role: 'scout', kpi_target: 5 });
      refetchScouts();
    }
  };

  const handleToggleScout = async (scoutId: number, isActive: boolean) => {
    await api.execute(
      fetch(ENDPOINTS.ADMIN_SCOUT_TOGGLE(scoutId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    refetchScouts();
  };

  const isLoading = tabValue === 0 ? statsLoading : scoutsLoading;

  if (isLoading) {
    return <LoadingState type="card" />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          ⚙️ Админ панель
        </Typography>
        <Box>
          <IconButton onClick={() => tabValue === 0 ? refetchStats() : refetchScouts()}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<BarChartIcon />} label="Статистика" />
        <Tab icon={<PersonAddIcon />} label="Скауты" />
        <Tab icon={<AssignmentIcon />} label="Задачи" />
        <Tab icon={<SettingsIcon />} label="Настройки" />
      </Tabs>

      {tabValue === 0 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="primary" fontWeight={700}>
                  {stats.total_candidates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего кандидатов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {stats.total_hired}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего наймов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  {stats.total_scouts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Скаутов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {stats.conversion_rate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Конверсия
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  📊 Распределение по статусам
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={2.4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="info.main">🆕</Typography>
                      <Typography variant="body2">{stats.status_distribution.new}</Typography>
                      <Typography variant="caption">Новые</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={2.4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="warning.main">📞</Typography>
                      <Typography variant="body2">{stats.status_distribution.contacted}</Typography>
                      <Typography variant="caption">Связались</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={2.4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="secondary">📅</Typography>
                      <Typography variant="body2">{stats.status_distribution.interviewed}</Typography>
                      <Typography variant="caption">Интервью</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={2.4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="success.main">🎯</Typography>
                      <Typography variant="body2">{stats.status_distribution.hired}</Typography>
                      <Typography variant="caption">Наймы</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={2.4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="error">❌</Typography>
                      <Typography variant="body2">{stats.status_distribution.rejected}</Typography>
                      <Typography variant="caption">Отказы</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Добавить скаута
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Кандидаты</TableCell>
                  <TableCell>Наймы</TableCell>
                  <TableCell>KPI</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scouts && scouts.map((scout) => (
                  <TableRow key={scout.id} hover>
                    <TableCell>{scout.telegram_id}</TableCell>
                    <TableCell>{scout.first_name}</TableCell>
                    <TableCell>@{scout.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={scout.role}
                        color={scout.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{scout.total_candidates}</TableCell>
                    <TableCell>{scout.total_hired}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 50, mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(scout.kpi_current / scout.kpi_target) * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="caption">
                          {scout.kpi_current}/{scout.kpi_target}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={scout.is_active ? 'Активен' : 'Заблокирован'}
                        color={scout.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleScout(scout.id, scout.is_active)}
                      >
                        {scout.is_active ? <DeleteIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавление нового скаута</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Telegram ID"
            type="number"
            fullWidth
            variant="outlined"
            value={newScout.telegram_id}
            onChange={(e) => setNewScout({ ...newScout, telegram_id: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Имя"
            fullWidth
            variant="outlined"
            value={newScout.first_name}
            onChange={(e) => setNewScout({ ...newScout, first_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={newScout.role}
              label="Роль"
              onChange={(e) => setNewScout({ ...newScout, role: e.target.value })}
            >
              <MenuItem value="scout">Скаут</MenuItem>
              <MenuItem value="admin">Администратор</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="KPI (цель по наймам в месяц)"
            type="number"
            fullWidth
            variant="outlined"
            value={newScout.kpi_target}
            onChange={(e) => setNewScout({ ...newScout, kpi_target: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Отмена</Button>
          <Button onClick={handleAddScout} variant="contained" disabled={!newScout.telegram_id || !newScout.first_name}>
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
