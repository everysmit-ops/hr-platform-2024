import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
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
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

const menuItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Кандидаты', icon: <PeopleIcon />, path: '/candidates' },
  { text: 'Статистика', icon: <BarChartIcon />, path: '/statistics' },
  { text: 'Топ лидеров', icon: <LeaderboardIcon />, path: '/leaderboard' },
  { text: 'Задачи', icon: <AssignmentIcon />, path: '/tasks' },
  { text: 'Чат', icon: <ChatIcon />, path: '/chat' },
  { text: 'Профиль', icon: <PersonIcon />, path: '/profile' },
  { text: 'Админ', icon: <AdminIcon />, path: '/admin', adminOnly: true },
];

const bottomNavItems = [
  { label: 'Главная', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Кандидаты', icon: <PeopleIcon />, path: '/candidates' },
  { label: 'Чат', icon: <ChatIcon />, path: '/chat' },
  { label: 'Профиль', icon: <PersonIcon />, path: '/profile' },
];

export default function Layout({ children, user }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#2481cc' }}>
          HR Agent
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          // Проверяем, нужно ли показывать пункт (для админа)
          if (item.adminOnly && user?.role !== 'admin') return null;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                    '&:hover': {
                      backgroundColor: '#bbdefb',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#2481cc' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'HR Agent'}
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Avatar
            sx={{ bgcolor: '#2481cc', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            {user?.first_name?.[0] || 'U'}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px',
          mb: { xs: '56px', sm: 0 },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>

      {/* Нижняя навигация для мобильных */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'block', sm: 'none' },
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={location.pathname}
          onChange={(event, newValue) => {
            navigate(newValue);
          }}
          showLabels
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              value={item.path}
              sx={{
                '&.Mui-selected': {
                  color: '#2481cc',
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

