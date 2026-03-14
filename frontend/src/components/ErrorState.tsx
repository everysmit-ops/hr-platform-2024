import React from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle } from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  error?: string | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showBackButton?: boolean;
  fullPage?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Ошибка',
  message = 'Произошла ошибка при загрузке данных',
  onRetry,
  showBackButton = true,
  fullPage = false
}) => {
  const navigate = useNavigate();

  const content = (
    <Paper
      elevation={fullPage ? 0 : 1}
      sx={{
        p: 4,
        borderRadius: 2,
        textAlign: 'center',
        maxWidth: 500,
        mx: 'auto'
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {message}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          <AlertTitle>Детали ошибки</AlertTitle>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {error}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            Повторить
          </Button>
        )}
        
        {showBackButton && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
        )}
      </Box>
    </Paper>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 3,
          bgcolor: '#f5f5f5'
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};
