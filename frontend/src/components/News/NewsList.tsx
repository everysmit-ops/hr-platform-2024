import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  PushPin as PinIcon,
  PushPinOutlined as PinOutlinedIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useApi, useFetch } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';
import { formatDistance } from 'date-fns';
import ruLocale from 'date-fns/locale/ru';

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

interface NewsListProps {
  isAdmin?: boolean;
}

export const NewsList: React.FC<NewsListProps> = ({ isAdmin = false }) => {
  const [openCreate, setOpenCreate] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNews, setSelectedNews] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const api = useApi();
  
  const { data: news, isLoading, refetch } = useFetch<NewsItem[]>(
    ENDPOINTS.NEWS,
    { autoFetch: true, initialData: [] }
  );

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, newsId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedNews(newsId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNews(null);
  };

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
      setSnackbar({
        open: true,
        message: 'Новость создана!',
        severity: 'success',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingNews) return;

    const result = await api.execute(
      fetch(ENDPOINTS.NEWS_DETAIL(editingNews.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })
    );

    if (result.success) {
      setEditingNews(null);
      setFormData({ title: '', content: '', image_url: '' });
      refetch();
      setSnackbar({
        open: true,
        message: 'Новость обновлена!',
        severity: 'success',
      });
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!window.confirm('Удалить новость?')) return;

    const result = await api.execute(
      fetch(ENDPOINTS.NEWS_DETAIL(newsId), {
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
        message: 'Новость удалена',
        severity: 'success',
      });
    }
    handleMenuClose();
  };

  const handlePin = async (newsId: number) => {
    const result = await api.execute(
      fetch(ENDPOINTS.NEWS_PIN(newsId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      refetch();
    }
    handleMenuClose();
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      image_url: newsItem.image_url || '',
    });
    handleMenuClose();
  };

  const pinnedNews = news?.filter(n => n.is_pinned) || [];
  const regularNews = news?.filter(n => !n.is_pinned) || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок и кнопка создания */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          📰 Новости
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
          >
            Создать новость
          </Button>
        )}
      </Box>

      {/* Закрепленные новости */}
      {pinnedNews.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PinIcon color="primary" /> Закрепленные
          </Typography>
          <Grid container spacing={2}>
            {pinnedNews.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Card sx={{ borderRadius: 2, borderLeft: '4px solid #2481cc' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.content}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.author_name} • {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true, locale: ruLocale })}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ViewIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {item.views}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {isAdmin && (
                        <IconButton onClick={(e) => handleMenuOpen(e, item.id)}>
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Обычные новости */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Все новости
        </Typography>
        <Grid container spacing={2}>
          {regularNews.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {item.author_name} • {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true, locale: ruLocale })}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ViewIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {item.views}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {isAdmin && (
                      <IconButton onClick={(e) => handleMenuOpen(e, item.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Меню действий для админа */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const newsItem = news?.find(n => n.id === selectedNews);
          if (newsItem) handleEdit(newsItem);
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Редактировать
        </MenuItem>
        <MenuItem onClick={() => selectedNews && handlePin(selectedNews)}>
          {news?.find(n => n.id === selectedNews)?.is_pinned ? (
            <><PinOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Открепить</>
          ) : (
            <><PinIcon fontSize="small" sx={{ mr: 1 }} /> Закрепить</>
          )}
        </MenuItem>
        <MenuItem onClick={() => selectedNews && handleDelete(selectedNews)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Удалить
        </MenuItem>
      </Menu>

      {/* Диалог создания/редактирования */}
      <Dialog 
        open={openCreate || !!editingNews} 
        onClose={() => {
          setOpenCreate(false);
          setEditingNews(null);
          setFormData({ title: '', content: '', image_url: '' });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNews ? 'Редактировать новость' : 'Создать новость'}
        </DialogTitle>
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
            label="URL изображения (опционально)"
            fullWidth
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCreate(false);
            setEditingNews(null);
            setFormData({ title: '', content: '', image_url: '' });
          }}>
            Отмена
          </Button>
          <Button 
            onClick={editingNews ? handleUpdate : handleCreate} 
            variant="contained"
            disabled={!formData.title || !formData.content}
          >
            {editingNews ? 'Сохранить' : 'Создать'}
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
