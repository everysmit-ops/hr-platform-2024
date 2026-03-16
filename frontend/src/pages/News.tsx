import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  PushPinOutlined as PinOutlinedIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../hooks/useApi';
import { ENDPOINTS } from '../config';
import { BRAND } from '../constants/branding';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  author_name: string;
  is_pinned: boolean;
  views: number;
  created_at: string;
}

export default function News() {
  const [openCreate, setOpenCreate] = React.useState(false);
  const [editingNews, setEditingNews] = React.useState<NewsItem | null>(null);
  const [formData, setFormData] = React.useState({ title: '', content: '', image_url: '' });
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const api = useApi();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  const { data: news, refetch } = useFetch<NewsItem[]>(
    ENDPOINTS.NEWS,
    { autoFetch: true, initialData: [] }
  );

  const handleCreate = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.NEWS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })
    );

    if (result.success) {
      setOpenCreate(false);
      setFormData({ title: '', content: '', image_url: '' });
      refetch();
      setSnackbar({ open: true, message: 'Новость создана!', severity: 'success' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить новость?')) return;
    
    const result = await api.execute(
      fetch(`${ENDPOINTS.NEWS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
    );

    if (result.success) {
      refetch();
      setSnackbar({ open: true, message: 'Новость удалена', severity: 'success' });
    }
  };

  return (
    <Box>
      {/* Заголовок с брендом */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {BRAND.NEWS_NAME}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Будьте в курсе последних событий компании
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 2 }}
          >
            Создать новость
          </Button>
        )}
      </Box>

      {/* Список новостей */}
      <Grid container spacing={3}>
        {news?.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Card sx={{ borderRadius: 2, position: 'relative' }}>
              {item.is_pinned && (
                <Chip
                  icon={<PinIcon />}
                  label="Закреплено"
                  size="small"
                  color="primary"
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                />
              )}
              <CardContent>
                <Grid container spacing={2}>
                  {item.image_url && (
                    <Grid item xs={12} md={3}>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={item.image_url ? 9 : 12}>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {item.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {item.author_name[0]}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {item.author_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(item.created_at), 'dd MMMM yyyy', { locale: ru })}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ViewIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {item.views}
                          </Typography>
                        </Box>
                      </Box>
                      {isAdmin && (
                        <Box>
                          <IconButton size="small" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Диалог создания */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создать новость в {BRAND.NEWS_NAME}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Заголовок"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Содержание"
            fullWidth
            multiline
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL изображения"
            fullWidth
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Отмена</Button>
          <Button onClick={handleCreate} variant="contained">
            Опубликовать
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
}
