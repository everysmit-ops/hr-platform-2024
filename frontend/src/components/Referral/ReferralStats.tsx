import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_bonus: number;
  pending_referrals: number;
  referral_link: string;
}

interface Referral {
  id: number;
  code: string;
  referrer_id: number;
  referred_id: number | null;
  status: string;
  bonus_amount: number;
  created_at: string;
  joined_at: string | null;
  referred_name: string | null;
}

interface TopReferrer {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  referrals_count: number;
  bonus: number;
  rating: number;
}

export const ReferralStats: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [generating, setGenerating] = useState(false);
  
  const api = useApi();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadReferralsList(),
      loadTopReferrers()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.REFERRAL_STATS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  const loadReferralsList = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.REFERRAL_LIST, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    if (result.success && result.data) {
      setReferrals(result.data);
    }
  };

  const loadTopReferrers = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.REFERRAL_TOP, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    if (result.success && result.data) {
      setTopReferrers(result.data);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    const result = await api.execute(
      fetch(ENDPOINTS.REFERRAL_GENERATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    setGenerating(false);
    
    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Реферальный код создан!',
        severity: 'success',
      });
      loadData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Ссылка скопирована!',
      severity: 'success',
    });
  };

  const shareLink = () => {
    if (stats?.referral_link) {
      if (navigator.share) {
        navigator.share({
          title: 'Приглашение в HR платформу',
          text: 'Присоединяйся по моей реферальной ссылке!',
          url: stats.referral_link,
        });
      } else {
        copyToClipboard(stats.referral_link);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        🤝 Реферальная система
      </Typography>

      <Grid container spacing={3}>
        {/* Статистика */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Ваша статистика
              </Typography>
              
              {!stats?.referral_link && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={generateCode}
                  disabled={generating}
                  sx={{ mb: 3 }}
                >
                  {generating ? <CircularProgress size={24} /> : 'Создать реферальный код'}
                </Button>
              )}

              {stats?.referral_link && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ваша реферальная ссылка:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => copyToClipboard(stats.referral_link)}
                      startIcon={<CopyIcon />}
                    >
                      Копировать
                    </Button>
                    <IconButton color="primary" onClick={shareLink}>
                      <ShareIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}

              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <PersonAddIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Всего приглашено"
                    secondary={stats?.total_referrals || 0}
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
                    secondary={stats?.active_referrals || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#ed6c02' }}>
                      <TrophyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Бонусов"
                    secondary={`${stats?.total_bonus || 0} баллов`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Топ приглашающих */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                🏆 Топ приглашающих
              </Typography>
              
              <List>
                {topReferrers.map((referrer, index) => (
                  <React.Fragment key={referrer.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={referrer.avatar || undefined}>
                          {referrer.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {index + 1}. {referrer.name}
                            </Typography>
                            {index === 0 && <Chip label="🥇" size="small" />}
                            {index === 1 && <Chip label="🥈" size="small" />}
                            {index === 2 && <Chip label="🥉" size="small" />}
                          </Box>
                        }
                        secondary={`@${referrer.username} • ${referrer.referrals_count} приглашений • ${referrer.bonus} бонусов`}
                      />
                      <Typography variant="body2" color="primary" fontWeight={600}>
                        Рейтинг: {referrer.rating}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Список приглашенных */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                📋 История приглашений
              </Typography>
              
              {referrals.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  У вас пока нет приглашенных пользователей
                </Typography>
              ) : (
                <List>
                  {referrals.map((ref, index) => (
                    <React.Fragment key={ref.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                {ref.referred_name || 'Ожидает регистрации'}
                              </Typography>
                              <Chip
                                label={
                                  ref.status === 'bonus_granted' ? 'Активен' :
                                  ref.status === 'joined' ? 'Зарегистрирован' :
                                  ref.status === 'pending' ? 'Ожидает' : ref.status
                                }
                                size="small"
                                color={
                                  ref.status === 'bonus_granted' ? 'success' :
                                  ref.status === 'joined' ? 'info' : 'default'
                                }
                              />
                            </Box>
                          }
                          secondary={`Код: ${ref.code} • ${new Date(ref.created_at).toLocaleDateString()}`}
                        />
                        {ref.bonus_amount > 0 && (
                          <Chip
                            label={`+${ref.bonus_amount} бонусов`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
};
