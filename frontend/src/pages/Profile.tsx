import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface ProfileData {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  bio?: string;
  role: 'scout' | 'admin';
  total_candidates: number;
  total_hired: number;
  kpi_target: number;
  kpi_current: number;
  rating: number;
  registered_at: string;
  last_active: string;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

interface StatsData {
  daily: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyProgress: Array<{ month: string; hired: number; total: number }>;
}

const COLORS = ['#1976d2', '#ed6c02', '#9c27b0', '#2e7d32', '#d32f2f'];

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [openSettings, setOpenSettings] = useState(false);

  const api = useApi();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useFetch<ProfileData>(
    ENDPOINTS.PROFILE,
    { autoFetch: true }
  );

  const { data: stats, isLoading: statsLoading } = useFetch<StatsData>(
    ENDPOINTS.PROFILE_STATS,
    { autoFetch: true }
  );

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editedProfile),
      })
    );

    if (result.success) {
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Профиль успешно обновлен!',
        severity: 'success',
      });
      refetchProfile();
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingsSave = () => {
    setOpenSettings(false);
    setSnackbar({
      open: true,
      message: 'Настройки сохранены',
      severity: 'success',
    });
  };

  if (profileLoading || statsLoading) {
    return <LoadingState type="card" />;
  }

  if (!profile) {
    return (
      <ErrorState 
        error="Профиль не найден"
        title="Ошибка загрузки"
        message="Не удалось загрузить профиль"
      />
    );
  }

  const kpiProgress = (profile.kpi_current / profile.kpi_target) * 100;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        👤 Профиль
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    src={editMode ? editedProfile.avatar : profile.avatar}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: '#2481cc',
                      fontSize: 48,
                      border: '4px solid #fff',
                      boxShadow: 2,
                    }}
                  >
                    {profile.first_name[0]}
                  </Avatar>
                  {editMode && (
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'white',
                        boxShadow: 2,
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <PhotoCameraIcon />
                    </IconButton>
                  )}
                </Box>

                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    label="Имя"
                    value={editedProfile.first_name || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {profile.first_name} {profile.last_name}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{profile.username}
                </Typography>

                <Chip
                  label={profile.role === 'admin' ? '👑 Администратор' : '🔍 Скаут'}
                  color={profile.role === 'admin' ? 'primary' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Контактная информация
              </Typography>

              {editMode ? (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    label="Телефон"
                    value={editedProfile.phone || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Email"
                    value={editedProfile.email || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="О себе"
                    multiline
                    rows={3}
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  />
                </>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {profile.phone && (
                    <Typography variant="body2" gutterBottom>
                      📞 {profile.phone}
                    </Typography>
                  )}
                  {profile.email && (
                    <Typography variant="body2" gutterBottom>
                      📧 {profile.email}
                    </Typography>
                  )}
                  {profile.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {profile.bio}
                    </Typography>
                  )}
                  {!profile.phone && !profile.email && !profile.bio && (
                    <Typography variant="body2" color="text.secondary">
                      Контактная информация не заполнена
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                {editMode ? (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Сохранить
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditMode(false);
                        setEditedProfile(profile);
                      }}
                    >
                      Отмена
                    </Button>
                  </>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    Редактировать
                  </Button>
                )}
              </Box>

              <Button
                fullWidth
                variant="text"
                startIcon={<SettingsIcon />}
                onClick={() => setOpenSettings(true)}
                sx={{ mt: 1 }}
              >
                Настройки
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                🎯 KPI
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Прогресс месяца</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {profile.kpi_current} / {profile.kpi_target}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={kpiProgress}
                  sx={{ height: 10, borderRadius: 5 }}
                  color={kpiProgress >= 100 ? 'success' : 'primary'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary" fontWeight={700}>
                    {profile.total_hired}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Всего наймов
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight={700}>
                    {profile.total_candidates}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Всего кандидатов
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {profile.rating}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Рейтинг
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Статистика" />
                <Tab label="Активность" />
                <Tab label="Достижения" />
              </Tabs>

              {tabValue === 0 && stats && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Динамика наймов
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2481cc" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Распределение по статусам
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={stats.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {stats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Месячная динамика
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.monthlyProgress}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hired" fill="#2e7d32" name="Наймы" />
                          <Bar dataKey="total" fill="#1976d2" name="Всего" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    Здесь будет отображаться история действий
                  </Typography>
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    Здесь будут отображаться достижения и награды
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                📅 Последняя активность
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Зарегистрирован
                  </Typography>
                  <Typography variant="body1">
                    {new Date(profile.registered_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Последний визит
                  </Typography>
                  <Typography variant="body1">
                    {new Date(profile.last_active).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Активен"
                  color="success"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openSettings} onClose={() => setOpenSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Настройки профиля</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.settings?.notifications}
                  onChange={(e) => setProfile({
                    ...profile,
                    settings: { ...profile.settings, notifications: e.target.checked }
                  })}
                />
              }
              label="Включить уведомления"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.settings?.darkMode}
                  onChange={(e) => setProfile({
                    ...profile,
                    settings: { ...profile.settings, darkMode: e.target.checked }
                  })}
                />
              }
              label="Темная тема"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Язык</InputLabel>
              <Select
                value={profile.settings?.language || 'ru'}
                label="Язык"
                onChange={(e) => setProfile({
                  ...profile,
                  settings: { ...profile.settings, language: e.target.value as string }
                })}
              >
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Отмена</Button>
          <Button onClick={handleSettingsSave} variant="contained">
            Сохранить
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
