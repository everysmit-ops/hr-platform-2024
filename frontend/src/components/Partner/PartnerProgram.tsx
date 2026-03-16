import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface PartnerInfo {
  is_partner: boolean;
  level?: number;
  level_name?: string;
  total_earned?: number;
  current_balance?: number;
  total_referrals?: number;
  active_referrals?: number;
  team_size?: number;
  team_commission?: number;
  referral_link?: string;
  next_level?: number;
  next_level_requirement?: number;
  recent_transactions?: Array<{
    id: number;
    type: string;
    amount: number;
    description: string;
    created_at: string;
  }>;
}

interface PartnerStats {
  total_earned_period: number;
  total_referrals_period: number;
  daily_stats: Record<string, { earned: number; referrals: number }>;
  level_stats: {
    pending: number;
    active: number;
    bonus_granted: number;
  };
  conversion_rate: number;
}

export const PartnerProgram: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('card');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const api = useApi();

  const { data: partnerInfo, isLoading: infoLoading, refetch: refetchInfo } = useFetch<PartnerInfo>(
    ENDPOINTS.PARTNER_INFO,
    { autoFetch: true }
  );

  const { data: stats, isLoading: statsLoading } = useFetch<PartnerStats>(
    ENDPOINTS.PARTNER_STATS,
    { autoFetch: true }
  );

  const { data: leaderboard } = useFetch<any[]>(
    ENDPOINTS.PARTNER_LEADERBOARD,
    { autoFetch: true }
  );

  const handleJoinProgram = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.JOIN_PARTNER_PROGRAM, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetchInfo();
      setSnackbar({
        open: true,
        message: 'Вы вступили в партнерскую программу!',
        severity: 'success',
      });
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Введите корректную сумму',
        severity: 'error',
      });
      return;
    }

    const result = await api.execute(
      fetch(`${ENDPOINTS.PARTNER_WITHDRAW}?amount=${amount}&payment_method=${withdrawMethod}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      setOpenWithdrawDialog(false);
      setWithdrawAmount('');
      refetchInfo();
      setSnackbar({
        open: true,
        message: 'Заявка на вывод создана',
        severity: 'success',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Ссылка скопирована',
      severity: 'success',
    });
  };

  if (infoLoading || statsLoading) {
    return <LinearProgress />;
  }

  if (!partnerInfo?.is_partner) {
    return (
      <Card sx={{ borderRadius: 2, textAlign: 'center', py: 6 }}>
        <CardContent>
          <TrophyIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Партнерская программа Every Scouting
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Приглашайте друзей и коллег, получайте до 10% от их платежей
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleJoinProgram}
            sx={{ px: 6, py: 2 }}
          >
            Вступить в программу
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Основная информация */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Уровень {partnerInfo.level}: {partnerInfo.level_name}
              </Typography>
              <Typography variant="h3" color="white" fontWeight={700}>
                {partnerInfo.total_earned} ₽
              </Typography>
              <Typography variant="body2" color="white">
                всего заработано
              </Typography>
              {partnerInfo.next_level && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="white">
                    До уровня {partnerInfo.next_level}: {partnerInfo.next_level_requirement} ₽
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={((partnerInfo.total_earned || 0) / ((partnerInfo.total_earned || 0) + (partnerInfo.next_level_requirement || 0))) * 100}
                    sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Текущий баланс
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight={700}>
                {partnerInfo.current_balance} ₽
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setOpenWithdrawDialog(true)}
                sx={{ mt: 2 }}
                disabled={!partnerInfo.current_balance || partnerInfo.current_balance < 1000}
              >
                Вывести средства
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Реферальная ссылка
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, bgcolor: '#f5f5f5', wordBreak: 'break-all' }}
              >
                <Typography variant="body2">
                  {partnerInfo.referral_link}
                </Typography>
              </Paper>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => copyToClipboard(partnerInfo.referral_link || '')}
                  fullWidth
                >
                  Копировать
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  fullWidth
                >
                  Поделиться
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Всего рефералов
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {partnerInfo.total_referrals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Активных
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {partnerInfo.active_referrals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Конверсия
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats?.conversion_rate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Команда
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {partnerInfo.team_size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Вкладки */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Рефералы" />
            <Tab label="Транзакции" />
            <Tab label="Топ партнеров" />
          </Tabs>

          {/* Рефералы */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Статистика рефералов
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Ожидают
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      {stats?.level_stats.pending || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Активны
                    </Typography>
                    <Typography variant="h5" color="info.main">
                      {stats?.level_stats.active || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      С бонусом
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {stats?.level_stats.bonus_granted || 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Транзакции */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Последние транзакции
              </Typography>
              <List>
                {partnerInfo.recent_transactions?.map((tx) => (
                  <ListItem key={tx.id} divider>
                    <ListItemIcon>
                      {tx.type === 'referral_commission' ? <MoneyIcon color="success" /> :
                       tx.type === 'withdrawal' ? <HistoryIcon color="error" /> :
                       <CheckCircleIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={tx.description}
                      secondary={new Date(tx.created_at).toLocaleDateString()}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={tx.amount > 0 ? 'success.main' : 'error.main'}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Топ партнеров */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Топ партнеров
              </Typography>
              <List>
                {leaderboard?.map((partner, index) => (
                  <ListItem key={partner.id} divider>
                    <ListItemIcon>
                      <Avatar src={partner.user_avatar}>
                        {partner.user_name[0]}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {index + 1}. {partner.user_name}
                          </Typography>
                          <Chip
                            label={partner.level_name}
                            size="small"
                            color={index === 0 ? 'warning' : index === 1 ? 'info' : 'default'}
                          />
                        </Box>
                      }
                      secondary={`${partner.total_earned} ₽ • ${partner.referrals_count} рефералов`}
                    />
                    <TrophyIcon sx={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Диалог вывода средств */}
      <Dialog open={openWithdrawDialog} onClose={() => setOpenWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Вывод средств</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Сумма вывода"
            type="number"
            fullWidth
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            helperText={`Минимальная сумма: 1000 ₽ • Доступно: ${partnerInfo.current_balance} ₽`}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Способ вывода
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                variant={withdrawMethod === 'card' ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => setWithdrawMethod('card')}
              >
                Банковская карта
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant={withdrawMethod === 'sbp' ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => setWithdrawMethod('sbp')}
              >
                СБП
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdrawDialog(false)}>Отмена</Button>
          <Button onClick={handleWithdraw} variant="contained">
            Вывести
          </Button>
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
