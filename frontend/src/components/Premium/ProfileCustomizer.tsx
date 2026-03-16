import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Avatar,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Brush as BrushIcon,
  Gif as GifIcon,
  Tag as TagIcon,
  EmojiEmotions as EmojiIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
  ColorLens as ColorIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Gradient as GradientIcon,
  Bolt as BoltIcon,
  ElectricBolt as NeonIcon,
  Shadow as ShadowIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface PremiumFeatures {
  can_customize_profile: boolean;
  can_animate_avatar: boolean;
  can_customize_nickname: boolean;
  can_add_emoji: boolean;
  can_have_badge: boolean;
  max_candidates: number;
  max_scouts: number;
  max_storage: number;
}

interface NicknameStyle {
  style: 'bold' | 'italic' | 'gradient' | 'glitch' | 'neon' | 'shadow';
  color?: string;
  gradient_from?: string;
  gradient_to?: string;
}

export const ProfileCustomizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('avatar');
  const [nicknameStyle, setNicknameStyle] = useState<NicknameStyle>({ style: 'bold' });
  const [nicknameEmoji, setNicknameEmoji] = useState('');
  const [emojiPosition, setEmojiPosition] = useState('before');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploading, setUploading] = useState(false);

  const api = useApi();

  const { data: features, isLoading } = useFetch<PremiumFeatures>(
    ENDPOINTS.SUBSCRIPTION_FEATURES,
    { autoFetch: true }
  );

  const { data: profilePreview, refetch: refreshPreview } = useFetch<any>(
    ENDPOINTS.PREMIUM_PREVIEW,
    { autoFetch: false }
  );

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await api.execute(
      fetch(ENDPOINTS.UPLOAD_ANIMATED_AVATAR, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
    );

    setUploading(false);

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Анимированный аватар загружен!',
        severity: 'success',
      });
      refreshPreview();
    }
  };

  const handleSaveNicknameStyle = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.UPDATE_NICKNAME_STYLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(nicknameStyle),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Стиль ника обновлен!',
        severity: 'success',
      });
      refreshPreview();
    }
  };

  const handleAddEmoji = async () => {
    if (!nicknameEmoji) return;

    const result = await api.execute(
      fetch(ENDPOINTS.ADD_NICKNAME_EMOJI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          emoji: nicknameEmoji,
          position: emojiPosition,
        }),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Эмодзи добавлен!',
        severity: 'success',
      });
      refreshPreview();
    }
  };

  const handleSetBadge = async () => {
    if (!selectedBadge) return;

    const result = await api.execute(
      fetch(ENDPOINTS.SET_CUSTOM_BADGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ badge: selectedBadge }),
      })
    );

    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Бейдж установлен!',
        severity: 'success',
      });
      refreshPreview();
    }
  };

  const getStylePreview = () => {
    let preview = profilePreview?.display_name || 'Ваше имя';
    return preview;
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Проверка доступа к премиум-функциям */}
      {!features?.can_customize_profile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Для доступа к премиум-кастомизации оформите подписку Pro или Business
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Меню функций */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Премиум-функции
              </Typography>
              <List>
                <ListItem
                  button
                  selected={activeTab === 'avatar'}
                  onClick={() => setActiveTab('avatar')}
                  disabled={!features?.can_animate_avatar}
                >
                  <ListItemIcon>
                    <GifIcon color={features?.can_animate_avatar ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Анимированный аватар"
                    secondary={!features?.can_animate_avatar && 'Только в Pro'}
                  />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'nickname'}
                  onClick={() => setActiveTab('nickname')}
                  disabled={!features?.can_customize_nickname}
                >
                  <ListItemIcon>
                    <TagIcon color={features?.can_customize_nickname ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Стиль ника"
                    secondary={!features?.can_customize_nickname && 'Только в Pro'}
                  />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'emoji'}
                  onClick={() => setActiveTab('emoji')}
                  disabled={!features?.can_add_emoji}
                >
                  <ListItemIcon>
                    <EmojiIcon color={features?.can_add_emoji ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Эмодзи к нику"
                    secondary={!features?.can_add_emoji && 'Только в Pro'}
                  />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'badge'}
                  onClick={() => setActiveTab('badge')}
                  disabled={!features?.can_have_badge}
                >
                  <ListItemIcon>
                    <BadgeIcon color={features?.can_have_badge ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Кастомный бейдж"
                    secondary={!features?.can_have_badge && 'Только в Business'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Панель настройки */}
        <Grid item xs={12} md={9}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  {activeTab === 'avatar' && 'Анимированный аватар'}
                  {activeTab === 'nickname' && 'Стиль ника'}
                  {activeTab === 'emoji' && 'Эмодзи рядом с ником'}
                  {activeTab === 'badge' && 'Кастомный бейдж'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={() => setPreviewOpen(true)}
                >
                  Предпросмотр
                </Button>
              </Box>

              {/* Анимированный аватар */}
              {activeTab === 'avatar' && (
                <Box>
                  <Typography variant="body2" paragraph>
                    Загрузите анимированный аватар (GIF, MP4, WebM, до 10MB)
                  </Typography>
                  
                  <input
                    accept="image/gif,video/mp4,video/webm"
                    style={{ display: 'none' }}
                    id="animated-avatar-upload"
                    type="file"
                    onChange={handleAvatarUpload}
                  />
                  <label htmlFor="animated-avatar-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<GifIcon />}
                      disabled={uploading}
                    >
                      {uploading ? 'Загрузка...' : 'Выбрать файл'}
                    </Button>
                  </label>
                  
                  {uploading && <LinearProgress sx={{ mt: 2 }} />}
                </Box>
              )}

              {/* Стиль ника */}
              {activeTab === 'nickname' && (
                <Box>
                  <ToggleButtonGroup
                    value={nicknameStyle.style}
                    exclusive
                    onChange={(e, value) => value && setNicknameStyle({ ...nicknameStyle, style: value })}
                    sx={{ mb: 3, flexWrap: 'wrap' }}
                  >
                    <ToggleButton value="bold">
                      <BoldIcon /> Жирный
                    </ToggleButton>
                    <ToggleButton value="italic">
                      <ItalicIcon /> Курсив
                    </ToggleButton>
                    <ToggleButton value="gradient">
                      <GradientIcon /> Градиент
                    </ToggleButton>
                    <ToggleButton value="glitch">
                      <BoltIcon /> Глитч
                    </ToggleButton>
                    <ToggleButton value="neon">
                      <NeonIcon /> Неон
                    </ToggleButton>
                    <ToggleButton value="shadow">
                      <ShadowIcon /> Тень
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {nicknameStyle.style === 'gradient' && (
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <TextField
                          label="Цвет 1"
                          type="color"
                          value={nicknameStyle.gradient_from || '#2481cc'}
                          onChange={(e) => setNicknameStyle({
                            ...nicknameStyle,
                            gradient_from: e.target.value
                          })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Цвет 2"
                          type="color"
                          value={nicknameStyle.gradient_to || '#4da3e0'}
                          onChange={(e) => setNicknameStyle({
                            ...nicknameStyle,
                            gradient_to: e.target.value
                          })}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}

                  {nicknameStyle.style === 'neon' && (
                    <TextField
                      label="Цвет неона"
                      type="color"
                      value={nicknameStyle.color || '#ff00ff'}
                      onChange={(e) => setNicknameStyle({ ...nicknameStyle, color: e.target.value })}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Button
                    variant="contained"
                    onClick={handleSaveNicknameStyle}
                    startIcon={<SaveIcon />}
                  >
                    Сохранить стиль
                  </Button>
                </Box>
              )}

              {/* Эмодзи к нику */}
              {activeTab === 'emoji' && (
                <Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Эмодзи"
                        value={nicknameEmoji}
                        onChange={(e) => setNicknameEmoji(e.target.value)}
                        placeholder="🌟"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Позиция</InputLabel>
                        <Select
                          value={emojiPosition}
                          label="Позиция"
                          onChange={(e) => setEmojiPosition(e.target.value)}
                        >
                          <MenuItem value="before">Перед именем</MenuItem>
                          <MenuItem value="after">После имени</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="contained"
                        onClick={handleAddEmoji}
                        startIcon={<EmojiIcon />}
                        fullWidth
                      >
                        Добавить
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Кастомный бейдж */}
              {activeTab === 'badge' && (
                <Box>
                  <ToggleButtonGroup
                    value={selectedBadge}
                    exclusive
                    onChange={(e, value) => value && setSelectedBadge(value)}
                    sx={{ mb: 3, flexWrap: 'wrap' }}
                  >
                    <ToggleButton value="vip">
                      <StarIcon /> VIP
                    </ToggleButton>
                    <ToggleButton value="pro">
                      <StarIcon /> PRO
                    </ToggleButton>
                    <ToggleButton value="legend">
                      <StarIcon /> Legend
                    </ToggleButton>
                    <ToggleButton value="expert">
                      <StarIcon /> Expert
                    </ToggleButton>
                    <ToggleButton value="top_scout">
                      <StarIcon /> Top Scout
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Button
                    variant="contained"
                    onClick={handleSetBadge}
                    startIcon={<BadgeIcon />}
                  >
                    Установить бейдж
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог предпросмотра */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Предпросмотр профиля</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={profilePreview?.animated_avatar || profilePreview?.avatar}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {getStylePreview()}
            </Typography>
            {profilePreview?.badge && (
              <Chip
                label={profilePreview.badge.label || 'VIP'}
                color="primary"
                sx={{ mt: 1 }}
              />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
