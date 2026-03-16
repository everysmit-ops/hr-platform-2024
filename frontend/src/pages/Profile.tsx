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
  Paper,
  Badge,
  Tooltip,
  Fab,
 List,
  ListItem,
  ListItemAvatar,
  ListItemText,
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
  Instagram as InstagramIcon,
  Telegram as TelegramIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as WebIcon,
  LocationOn as LocationIcon,
  Cake as CakeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  cover_image?: string;
  bio?: string;
  phone?: string;
  email?: string;
  city?: string;
  birth_date?: string;
  
  // Social
  instagram?: string;
  telegram?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  
  // Stats
  role: 'scout' | 'admin';
  total_candidates: number;
  total_hired: number;
  kpi_target: number;
  kpi_current: number;
  rating: number;
  referral_bonus: number;
  is_verified: boolean;
  
  // Dates
  created_at: string;
  last_active: string;
}

interface Settings {
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  profile_settings: Record<string, any>;
}

interface StatsData {
  daily: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyProgress: Array<{ month: string; hired: number; total: number }>;
  referrals: {
    total: number;
    active: number;
    pending: number;
    bonus: number;
  };
}

const COLORS = ['#1976d2', '#ed6c02', '#9c27b0', '#2e7d32', '#d32f2f'];

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [openSettings, setOpenSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    notifications_enabled: true,
    email_notifications: false,
    language: 'ru',
    profile_settings: {},
  });

  const api = useApi();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useFetch<ProfileData>(
    ENDPOINTS.PROFILE,
    { autoFetch: true }
  );

  const { data: stats, isLoading: statsLoading } = useFetch<StatsData>(
    ENDPOINTS.PROFILE_STATS,
    { autoFetch: true }
  );

  const { data: userSettings } = useFetch<Settings>(
    `${ENDPOINTS.PROFILE}/settings`,
    { autoFetch: true }
  );

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [userSettings]);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const result = await api.execute(
      fetch(`${ENDPOINTS.PROFILE}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Аватар обновлен!',
        severity: 'success',
      });
      refetchProfile();
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const result = await api.execute(
      fetch(`${ENDPOINTS.PROFILE}/cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Обложка обновлена!',
        severity: 'success',
      });
      refetchProfile();
    }
  };

  const handleSettingsSave = async () => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.PROFILE}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      })
    );

    if (result.success) {
      setOpenSettings(false);
      setSnackbar({
        open: true,
        message: 'Настройки сохранены',
        severity: 'success',
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      {/* Обложка профиля */}
      <Paper
        sx={{
          position: 'relative',
          height: 200,
          bgcolor: 'primary.main',
          backgroundImage: profile.cover_image ? `url(${profile.cover_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          mb: 8,
        }}
      >
        {editMode && (
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="cover-upload"
            type="file"
            onChange={handleCoverUpload}
          />
        )}
        {editMode && (
          <label htmlFor="cover-upload">
            <Fab
              size="small"
              component="span"
              sx={{ position: 'absolute', bottom: 16, right: 16 }}
            >
              <PhotoCameraIcon />
            </Fab>
          </label>
        )}
      </Paper>

      {/* Аватар */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: -10 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            editMode ? (
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
              />
            ) : null
          }
        >
          <Avatar
            src={profile.avatar}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              boxShadow: 3,
            }}
          >
            {profile.first_name[0]}
          </Avatar>
          {editMode && (
            <label htmlFor="avatar-upload">
              <IconButton
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'white',
                  '&:hover': { bgcolor: '#f5f5f5' },
                }}
              >
                <PhotoCameraIcon />
              </IconButton>
            </label>
          )}
        </Badge>
      </Box>

      {/* Имя и роль */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        {editMode ? (
          <TextField
            value={editedProfile.first_name || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
            size="small"
            sx={{ mb: 1 }}
          />
        ) : (
          <Typography variant="h4" fontWeight={700}>
            {profile.first_name} {profile.last_name}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
          <Chip
            label={profile.role === 'admin' ? '👑 Администратор' : '🔍 Скаут'}
            color={profile.role === 'admin' ? 'primary' : 'default'}
          />
          {profile.is_verified && (
            <Tooltip title="Верифицированный профиль">
              <CheckCircleIcon color="primary" fontSize="small" />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Статистика в карточках */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary">
              {profile.total_candidates}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Кандидатов
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="success.main">
              {profile.total_hired}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Наймов
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="warning.main">
              {profile.rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Рейтинг
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="info.main">
              {profile.referral_bonus}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Бонусы
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* KPI Прогресс */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 KPI месяца
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={kpiProgress}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {profile.kpi_current}/{profile.kpi_target}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Вкладки */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="О себе" />
            <Tab label="Статистика" />
            <Tab label="Контакты" />
            <Tab label="Достижения" />
          </Tabs>

          {/* Вкладка "О себе" */}
          {tabValue === 0 && (
            <Box>
              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="О себе"
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="body1" paragraph>
                  {profile.bio || 'Пользователь пока ничего не рассказал о себе'}
                </Typography>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    {editMode ? (
                      <TextField
                        size="small"
                        label="Город"
                        value={editedProfile.city || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                      />
                    ) : (
                      <Typography variant="body2">
                        {profile.city || 'Город не указан'}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CakeIcon color="action" />
                    {editMode ? (
                      <TextField
                        size="small"
                        type="date"
                        label="Дата рождения"
                        value={editedProfile.birth_date?.split('T')[0] || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography variant="body2">
                        {profile.birth_date 
                          ? format(new Date(profile.birth_date), 'dd MMMM yyyy', { locale: ru })
                          : 'Дата не указана'
                        }
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Вкладка "Статистика" */}
          {tabValue === 1 && stats && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Динамика за неделю
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#2481cc" />
                </BarChart>
              </ResponsiveContainer>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Статусы кандидатов
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Реферальная статистика
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1976d2' }}>
                          <GroupIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Всего приглашено"
                        secondary={stats.referrals.total}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#2e7d32' }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Активных"
                        secondary={stats.referrals.active}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#ed6c02' }}>
                          <StarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Бонусов"
                        secondary={stats.referrals.bonus}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Вкладка "Контакты" */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <EmailIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="Email"
                      value={editedProfile.email || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.email || 'Email не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PhoneIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="Телефон"
                      value={editedProfile.phone || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.phone || 'Телефон не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TelegramIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="Telegram"
                      value={editedProfile.telegram || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, telegram: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.telegram ? `@${profile.telegram}` : 'Telegram не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <InstagramIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="Instagram"
                      value={editedProfile.instagram || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.instagram || 'Instagram не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <LinkedInIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="LinkedIn"
                      value={editedProfile.linkedin || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedin: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.linkedin || 'LinkedIn не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <GitHubIcon color="action" />
                  {editMode ? (
                    <TextField
                      size="small"
                      label="GitHub"
                      value={editedProfile.github || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, github: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">
                      {profile.github || 'GitHub не указан'}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Вкладка "Достижения" */}
          {tabValue === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrophyIcon sx={{ fontSize: 60, color: '#FFD700', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ваши достижения
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Здесь будут отображаться полученные награды и достижения
              </Typography>
              <Chip
                label="Новичок"
                color="primary"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
              <Chip
                label="5 наймов"
                color="success"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
              {profile.total_hired >= 10 && (
                <Chip
                  label="10 наймов"
                  color="warning"
                  sx={{ m: 0.5 }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
          <>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Редактировать
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setOpenSettings(true)}
            >
              Настройки
            </Button>
          </>
        )}
      </Box>

      {/* Диалог настроек */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Настройки профиля</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тема оформления</InputLabel>
              <Select
                value={settings.theme}
                label="Тема оформления"
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              >
                <MenuItem value="light">Светлая</MenuItem>
                <MenuItem value="dark">Темная</MenuItem>
                <MenuItem value="system">Как в системе</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Язык</InputLabel>
              <Select
                value={settings.language}
                label="Язык"
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                />
              }
              label="Включить уведомления"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                />
              }
              label="Уведомления по email"
              sx={{ mb: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Отмена</Button>
          <Button onClick={handleSettingsSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar уведомления */}
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
