import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import Referrals from './pages/Referrals';
import Training from './pages/Training';
import Notifications from './pages/Notifications';

import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
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
import Calendar from './pages/Calendar';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const mockUser = {
      id: 12345,
      username: 'test_user',
      first_name: 'Тест',
      role: 'admin'
    };
    
    setUser(mockUser as any);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
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
      <SocketProvider>
        <ThemeProvider>
          <CssBaseline />
          <BrowserRouter>
            <Layout user={user}>
              <Routes>
                <Route path="/training" element={<Training />} />
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
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/notifications" element={<Notifications />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </ErrorBoundary>
  );
}

export default App;
