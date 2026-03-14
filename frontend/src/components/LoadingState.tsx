import React from 'react';
import { Box, CircularProgress, Typography, Skeleton, Paper } from '@mui/material';

interface LoadingStateProps {
  type?: 'fullscreen' | 'card' | 'list' | 'table';
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'fullscreen',
  message = 'Загрузка...',
  count = 3
}) => {
  if (type === 'fullscreen') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  if (type === 'card') {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </Box>
      </Paper>
    );
  }

  if (type === 'list') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

