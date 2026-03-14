import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { People, Assignment, Chat, TrendingUp } from '@mui/icons-material';

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        📊 Дашборд
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Кандидаты
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    127
                  </Typography>
                </Box>
                <People sx={{ fontSize: 48, color: '#1976d2', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Задачи
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    8
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 48, color: '#ed6c02', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Сообщения
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    12
                  </Typography>
                </Box>
                <Chat sx={{ fontSize: 48, color: '#2e7d32', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Конверсия
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    24%
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: '#9c27b0', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
