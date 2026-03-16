import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  WorkspacePremium as PremiumIcon,
  Diamond as DiamondIcon,
  EmojiEvents as TrophyIcon,
  Brush as BrushIcon,
  Gif as GifIcon,
  Tag as TagIcon,
  EmojiEmotions as EmojiIcon,
  Badge as BadgeIcon,
  People as PeopleIcon,
  Api as ApiIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: {
    max_candidates: number;
    max_scouts: number;
    max_storage: number;
    custom_profile: boolean;
    animated_avatar: boolean;
    custom_nickname: boolean;
    emoji_nickname: boolean;
    custom_badge: boolean;
    team_management?: boolean;
    api_access?: boolean;
    priority_support?: boolean;
  };
}

interface SubscriptionInfo {
  plan_id: string;
  plan_name: string;
  status: string;
  features: any;
  end_date?: string;
  auto_renew: boolean;
}

export const SubscriptionPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const api = useApi();

  const { data: plans, isLoading: plansLoading } = useFetch<Plan[]>(
    ENDPOINTS.SUBSCRIPTION_PLANS,
    { autoFetch: true, initialData: [] }
  );

  const { data: currentSubscription, refetch: refetchSubscription } = useFetch<SubscriptionInfo>(
    ENDPOINTS.MY_SUBSCRIPTION,
    { autoFetch: true }
  );

  const { data: features } = useFetch<any>(
    ENDPOINTS.SUBSCRIPTION_FEATURES,
    { autoFetch: true }
  );

  const handleSubscribe = async () => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.SUBSCRIBE}/${selectedPlan}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ payment_method: paymentMethod }),
      })
    );

    if (result.success) {
      setOpenDialog(false);
      refetchSubscription();
      setSnackbar({
        open: true,
        message: 'Подписка оформлена!',
        severity: 'success',
      });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку?')) return;

    const result = await api.execute(
      fetch(ENDPOINTS.CANCEL_SUBSCRIPTION, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetchSubscription();
      setSnackbar({
        open: true,
        message: 'Подписка отменена',
        severity: 'success',
      });
    }
  };

  const getPlanIcon = (planId: string) => {
    switch(planId) {
      case 'basic': return <StarIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />;
      case 'pro': return <PremiumIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
      case 'business': return <DiamondIcon sx={{ fontSize: 40, color: '#ff9800' }} />;
      default: return <StarIcon />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch(feature) {
      case 'custom_profile': return <BrushIcon />;
      case 'animated_avatar': return <GifIcon />;
      case 'custom_nickname': return <TagIcon />;
      case 'emoji_nickname': return <EmojiIcon />;
      case 'custom_badge': return <BadgeIcon />;
      case 'team_management': return <PeopleIcon />;
      case 'api_access': return <ApiIcon />;
      case 'priority_support': return <SupportIcon />;
      default: return <CheckIcon />;
    }
  };

  if (plansLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Текущая подписка */}
      {currentSubscription && (
        <Card sx={{ mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="white">
              Ваша подписка: {currentSubscription.plan_name}
            </Typography>
            <Typography variant="body2" color="white" paragraph>
              Статус: {currentSubscription.status === 'active' ? 'Активна' : 'Неактивна'}
            </Typography>
            {currentSubscription.end_date && (
              <Typography variant="body2" color="white">
                Действует до: {new Date(currentSubscription.end_date).toLocaleDateString()}
              </Typography>
            )}
            {currentSubscription.plan_id !== 'basic' && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCancel}
                sx={{ mt: 2, color: 'white', borderColor: 'white' }}
              >
                Отменить подписку
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Доступные функции */}
      {features && (
        <Card sx={{ mb: 4, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ваши возможности
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Chip
                  label={`${features.max_candidates === 0 ? '∞' : features.max_candidates} кандидатов`}
                  color={features.max_candidates > 50 ? 'success' : 'default'}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label={`${features.max_scouts} скаутов`}
                  color={features.max_scouts > 1 ? 'success' : 'default'}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label={`${features.max_storage} МБ хранилища`}
                  color={features.max_storage > 100 ? 'success' : 'default'}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label={features.can_customize_profile ? '✨ Кастомный профиль' : 'Стандартный профиль'}
                  color={features.can_customize_profile ? 'success' : 'default'}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Тарифы */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Выберите тариф
      </Typography>

      <Grid container spacing={3}>
        {plans?.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                borderRadius: 2,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: selectedPlan === plan.id ? '2px solid #2481cc' : 'none',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.id === 'pro' && (
                <Chip
                  label="Популярное"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: -10, right: 20 }}
                />
              )}
              {plan.id === 'business' && (
                <Chip
                  label="Для команд"
                  color="warning"
                  size="small"
                  sx={{ position: 'absolute', top: -10, right: 20 }}
                />
              )}
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {getPlanIcon(plan.id)}
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {plan.price === 0 ? 'Бесплатно' : `${plan.price} ₽/мес`}
                  </Typography>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`До ${plan.features.max_candidates === 0 ? '∞' : plan.features.max_candidates} кандидатов`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={`До ${plan.features.max_scouts} скаутов`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={`${plan.features.max_storage} МБ хранилища`} />
                  </ListItem>
                  
                  {plan.features.custom_profile && (
                    <ListItem>
                      <ListItemIcon>
                        <BrushIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Кастомизация профиля" />
                    </ListItem>
                  )}
                  
                  {plan.features.animated_avatar && (
                    <ListItem>
                      <ListItemIcon>
                        <GifIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Анимированный аватар" />
                    </ListItem>
                  )}
                  
                  {plan.features.custom_nickname && (
                    <ListItem>
                      <ListItemIcon>
                        <TagIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Стиль ника" />
                    </ListItem>
                  )}
                  
                  {plan.features.emoji_nickname && (
                    <ListItem>
                      <ListItemIcon>
                        <EmojiIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Эмодзи рядом с ником" />
                    </ListItem>
                  )}
                  
                  {plan.features.custom_badge && (
                    <ListItem>
                      <ListItemIcon>
                        <BadgeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Кастомный бейдж" />
                    </ListItem>
                  )}
                  
                  {plan.features.team_management && (
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Управление командой" />
                    </ListItem>
                  )}
                  
                  {plan.features.api_access && (
                    <ListItem>
                      <ListItemIcon>
                        <ApiIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="API доступ" />
                    </ListItem>
                  )}
                  
                  {plan.features.priority_support && (
                    <ListItem>
                      <ListItemIcon>
                        <SupportIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Приоритетная поддержка" />
                    </ListItem>
                  )}
                </List>

                <Button
                  fullWidth
                  variant={selectedPlan === plan.id ? "contained" : "outlined"}
                  sx={{ mt: 2 }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {currentSubscription?.plan_id === plan.id ? 'Текущий тариф' : 'Выбрать'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Кнопка оформления */}
      {selectedPlan !== currentSubscription?.plan_id && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpenDialog(true)}
            sx={{ px: 6, py: 2, borderRadius: 2 }}
          >
            Оформить подписку
          </Button>
        </Box>
      )}

      {/* Диалог оплаты */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Оформление подписки</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Вы выбрали тариф: {plans?.find(p => p.id === selectedPlan)?.name}
          </Typography>
          <Typography variant="h6" gutterBottom>
            Сумма: {plans?.find(p => p.id === selectedPlan)?.price} ₽/мес
          </Typography>

          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            sx={{ mt: 2 }}
          >
            <FormControlLabel value="card" control={<Radio />} label="Банковская карта" />
            <FormControlLabel value="yoomoney" control={<Radio />} label="ЮMoney" />
            <FormControlLabel value="sbp" control={<Radio />} label="СБП" />
          </RadioGroup>

          <Alert severity="info" sx={{ mt: 2 }}>
            После оплаты все премиум-функции станут доступны сразу
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button onClick={handleSubscribe} variant="contained">
            Оплатить
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
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
