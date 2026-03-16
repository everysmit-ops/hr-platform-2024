import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Leaderboard as LeaderboardIcon,
  Assignment as AssignmentIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Brightness4,
  Brightness7,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';
import { NotificationCenter } from './Notifications/NotificationCenter';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

const menuItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, path: '/dashboard', color: '#2481cc' },
  { text: 'Кандидаты', icon: <PeopleIcon />, path: '/candidates', color: '#4caf50' },
  { text: 'Статистика', icon: <BarChartIcon />, path: '/statistics', color: '#ff9800' },
  { text: 'Топ лидеров', icon: <LeaderboardIcon />, path: '/leaderboard', color: '#9c27b0' },
  { text: 'Задачи', icon: <AssignmentIcon />, path: '/tasks', color: '#f44336' },
  { text: 'Календарь', icon: <CalendarIcon />, path: '/calendar', color: '#2196f3' },
  { text: 'Обучение', icon: <SchoolIcon />, path: '/training', color: '#00bcd4' },
  { text: 'Чат', icon: <ChatIcon />, path: '/chat', color: '#ff4081' },
  { text: 'Профиль', icon: <PersonIcon />, path: '/profile', color: '#607d8b' },
  { text: 'Админ', icon: <AdminIcon />, path: '/admin', color: '#e91e63', adminOnly: true },
];

const bottomNavItems = [
  { label: 'Главная', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Кандидаты', icon: <PeopleIcon />, path: '/candidates' },
  { label: 'Календарь', icon: <CalendarIcon />, path: '/calendar' },
  { label: 'Профиль', icon: <PersonIcon />, path: '/profile' },
];

export default function Layout({ children, user }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeMode();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
{/* Логотип Every Scouting */}
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    cursor: 'pointer',
  }}
  onClick={() => navigate('/dashboard')}
>
  <Box
    sx={{
      width: 40,
      height: 40,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #2481cc 0%, #4da3e0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 700,
      fontSize: 18,
    }}
  >
    ES
  </Box>
  <Box>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        lineHeight: 1.2,
        background: 'linear-gradient(135deg, #2481cc 0%, #4da3e0 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Every
    </Typography>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'text.primary',
      }}
    >
      Scouting
    </Typography>
  </Box>
</Box>

        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2481cc 0%, #4da3e0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            H
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2481cc 0%, #4da3e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HR Agent
          </Typography>
        </Box>
      </Box>

      {/* Меню */}
      <List sx={{ flex: 1, px: 2 }}>
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          
          const isSelected = location.pathname === item.path;
          const isHovered = hoveredItem === item.text;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                onMouseEnter={() => setHoveredItem(item.text)}
                onMouseLeave={() => setHoveredItem(null)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 0.5,
                  },
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${item.color} 0%, ${alpha(item.color, 0.8)} 100%)`,
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? 'white' : isHovered ? item.color : 'text.secondary',
                    transition: 'color 0.3s ease',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                />
                {isSelected && (
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      borderRadius: 2,
                      background: 'white',
                      position: 'absolute',
                      right: 8,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Нижняя часть меню (пользователь) */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <ListItemButton
          onClick={() => navigate('/profile')}
          sx={{
            borderRadius: 2,
            p: 1,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: alpha('#2481cc', 0.1),
            },
          }}
        >
          <Avatar
            src={user?.avatar}
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              border: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            {user?.first_name?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.first_name || 'Пользователь'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{user?.username || 'username'}
            </Typography>
          </Box>
        </ListItemButton>

        <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
          <Tooltip title="Настройки">
            <IconButton size="small" onClick={() => navigate('/profile?tab=settings')}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Тема">
            <IconButton size="small" onClick={toggleTheme}>
              {mode === 'light' ? <Brightness4 fontSize="small" /> : <Brightness7 fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Выйти">
            <IconButton size="small" onClick={handleLogout}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(30,30,30,0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'HR Agent'}
          </Typography>

          <NotificationCenter />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)',
              backdropFilter: 'blur(10px)',
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)',
              backdropFilter: 'blur(10px)',
              borderRight: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
        }}
      >
        <Toolbar sx={{ mb: { xs: 7, sm: 3 } }} />
        <Box
          sx={{
            animation: 'fadeIn 0.5s ease',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Bottom Navigation for mobile */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'block', sm: 'none' },
          zIndex: 1000,
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: 1,
          borderColor: 'divider',
        }}
        elevation={3}
      >
        <BottomNavigation
          value={location.pathname}
          onChange={(event, newValue) => {
            navigate(newValue);
          }}
          showLabels
          sx={{
            bgcolor: 'transparent',
            height: 64,
          }}
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              value={item.path}
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
