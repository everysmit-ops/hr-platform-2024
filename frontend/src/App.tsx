import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import Statistics from './pages/Statistics';
import Leaderboard from './pages/Leaderboard';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2481cc',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Простая инициализация без Telegram SDK для тестирования
    const mockUser = {
      id: 12345,
      username: 'test_user',
      first_name: 'Тест',
    };
    
    setUser(mockUser as any);
    
    // Имитация загрузки
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

return (
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout user={user}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

}

export default App;
