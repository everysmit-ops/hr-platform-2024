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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Slider,
} from '@mui/material';
import {
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  AdminPanelSettings as AdminIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface TeamInfo {
  has_team: boolean;
  team?: {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    total_members: number;
    stats: {
      total_candidates: number;
      total_hired: number;
      conversion_rate: number;
      total_earned: number;
    };
  };
  members?: Array<{
    id: number;
    name: string;
    avatar: string | null;
    role: 'owner' | 'admin' | 'member';
    commission_share: number;
    joined_at: string;
  }>;
}

export const TeamManagement: React.FC = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    telegram_id: '',
    role: 'member',
    commission_share: 0,
  });

  const api = useApi();

  const { data: teamInfo, isLoading, refetch } = useFetch<TeamInfo>(
    ENDPOINTS.MY_TEAM,
    { autoFetch: true }
  );

  const handleCreateTeam = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.CREATE_TEAM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newTeam),
      })
    );

    if (result.success) {
      setOpenCreateDialog(false);
      refetch();
      setSnackbar({
        open: true,
        message: 'Команда создана!',
        severity: 'success',
      });
    }
  };

  const handleInvite = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.INVITE_TO_TEAM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(inviteData),
      })
    );

    if (result.success) {
      setOpenInviteDialog(false);
      setInviteData({ email: '', telegram_id: '', role: 'member', commission_share: 0 });
      refetch();
      setSnackbar({
        open: true,
        message: 'Приглашение отправлено!',
        severity: 'success',
      });
    }
  };

  const handleChangeRole = async (userId: number, newRole: string, commission?: number) => {
    const result = await api.execute(
      fetch(`${ENDPOINTS.TEAM_MEMBER_ROLE(userId)}?new_role=${newRole}&commission_share=${commission || 0}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setAnchorEl(null);
      setSelectedMember(null);
      setSnackbar({
        open: true,
        message: 'Роль обновлена',
        severity: 'success',
      });
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Удалить участника из команды?')) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.TEAM_MEMBER_REMOVE(userId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({
        open: true,
        message: 'Участник удален',
        severity: 'success',
      });
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Вы уверены, что хотите покинуть команду?')) return;

    const result = await api.execute(
      fetch(ENDPOINTS.LEAVE_TEAM, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({
        open: true,
        message: 'Вы покинули команду',
        severity: 'success',
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить команду? Это действие необратимо.')) return;

    const result = await api.execute(
      fetch(`${ENDPOINTS.DELETE_TEAM}?confirm=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({
        open: true,
        message: 'Команда удалена',
        severity: 'success',
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const isOwner = teamInfo?.team?.owner_id === JSON.parse(localStorage.getItem('user') || '{}').id;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (isLoading) {
    return <LinearProgress />;
  }

  if (!teamInfo?.has_team) {
    return (
      <Card sx={{ borderRadius: 2, textAlign: 'center', py: 6 }}>
        <CardContent>
          <GroupIcon sx={{ fontSize: 80, color: '#2481cc', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Управление командой
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Создайте команду и приглашайте коллег для совместной работы
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpenCreateDialog(true)}
            startIcon={<GroupIcon />}
            sx={{ px: 6, py: 2 }}
          >
            Создать команду
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Информация о команде */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {teamInfo.team?.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {teamInfo.team?.description}
                  </Typography>
                  <Chip
                    icon={<GroupIcon />}
                    label={`${teamInfo.team?.total_members} участников`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {isOwner && (
                    <Chip
                      icon={<AdminIcon />}
                      label="Владелец"
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
                {isOwner && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteTeam}
                  >
                    Удалить команду
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Статистика команды
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="white" fontWeight={700}>
                    {teamInfo.team?.stats.total_candidates}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Кандидатов
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="white" fontWeight={700}>
                    {teamInfo.team?.stats.total_hired}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Наймов
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="white" fontWeight={700}>
                    {teamInfo.team?.stats.conversion_rate}%
                  </Typography>
                  <Typography variant="body2" color="white">
                    Конверсия
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="white" fontWeight={700}>
                    {teamInfo.team?.stats.total_earned} ₽
                  </Typography>
                  <Typography variant="body2" color="white">
                    Заработано
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Участники команды */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Участники команды
            </Typography>
            {isOwner && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenInviteDialog(true)}
              >
                Пригласить
              </Button>
            )}
            {!isOwner && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitIcon />}
                onClick={handleLeaveTeam}
              >
                Покинуть команду
              </Button>
            )}
          </Box>

          <List>
            {teamInfo.members?.map((member, index) => (
              <React.Fragment key={member.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    (isOwner && member.role !== 'owner') && (
                      <IconButton onClick={(e) => handleMenuOpen(e, member)}>
                        <MoreVertIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={member.avatar || undefined}>
                      {member.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {member.name}
                        </Typography>
                        {member.role === 'owner' && (
                          <Chip label="Владелец" size="small" color="primary" />
                        )}
                        {member.role === 'admin' && (
                          <Chip label="Админ" size="small" color="secondary" />
                        )}
                      </Box>
                    }
                    secondary={`В команде с ${new Date(member.joined_at).toLocaleDateString()}`}
                  />
                  {member.role !== 'owner' && (
                    <Typography variant="body2" color="success.main" sx={{ mr: 2 }}>
                      {member.commission_share}% комиссии
                    </Typography>
                  )}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Диалог создания команды */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание команды</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название команды"
            fullWidth
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
          <Button onClick={handleCreateTeam} variant="contained" disabled={!newTeam.name}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог приглашения */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Пригласить в команду</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Укажите email или Telegram ID пользователя
          </Alert>
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Telegram ID"
            fullWidth
            type="number"
            value={inviteData.telegram_id}
            onChange={(e) => setInviteData({ ...inviteData, telegram_id: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={inviteData.role}
              label="Роль"
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
            >
              <MenuItem value="member">Участник</MenuItem>
              <MenuItem value="admin">Администратор</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Доля комиссии: {inviteData.commission_share}%</Typography>
            <Slider
              value={inviteData.commission_share}
              onChange={(e, value) => setInviteData({ ...inviteData, commission_share: value as number })}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Отмена</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteData.email && !inviteData.telegram_id}
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Меню действий для участника */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleChangeRole(selectedMember?.id, 'admin', selectedMember?.commission_share)}>
          <ListItemIcon>
            <AdminIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Сделать админом</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole(selectedMember?.id, 'member', selectedMember?.commission_share)}>
          <ListItemIcon>
            <PersonAddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Сделать участником</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          const newCommission = prompt('Введите новую долю комиссии (0-100)', String(selectedMember?.commission_share));
          if (newCommission) {
            handleChangeRole(selectedMember?.id, selectedMember?.role, parseInt(newCommission));
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Изменить комиссию</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleRemoveMember(selectedMember?.id)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <PersonRemoveIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Удалить из команды</ListItemText>
        </MenuItem>
      </Menu>

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
