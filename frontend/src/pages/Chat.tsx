import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Divider,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch, useApi } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface ChatUser {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  last_seen?: string;
  unread_count?: number;
}

interface Message {
  id: number;
  text: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  read: boolean;
}

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 1;

  const api = useApi();

  const { data: users, isLoading, isError, error, refetch } = useFetch<ChatUser[]>(
    ENDPOINTS.CHAT_USERS,
    { 
      autoFetch: true,
      initialData: [] 
    }
  );

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (userId: number) => {
    const result = await api.execute(
      fetch(ENDPOINTS.CHAT_MESSAGES(userId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success && result.data) {
      setMessages(result.data as Message[]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const result = await api.execute(
      fetch(ENDPOINTS.CHAT_SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          text: newMessage,
        }),
      })
    );

    if (result.success) {
      setNewMessage('');
      fetchMessages(selectedUser.id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString();
  };

  const usersArray = Array.isArray(users) ? users : [];
  
  const filteredUsers = usersArray.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingState type="card" />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки чата"
        message="Не удалось загрузить список пользователей"
        onRetry={refetch}
      />
    );
  }

  return (
    <Card sx={{ height: 'calc(100vh - 100px)', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          <Grid 
            item 
            xs={12} 
            md={4} 
            sx={{ 
              borderRight: 1, 
              borderColor: 'divider', 
              height: '100%', 
              display: { xs: selectedUser ? 'none' : 'block', md: 'block' },
              overflow: 'auto'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={600}>
                💬 Чаты
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 1 }}
              />
            </Box>
            
            {filteredUsers.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Пользователи не найдены
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    component="div"
                    onClick={() => setSelectedUser(user)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      ...(selectedUser?.id === user.id && {
                        backgroundColor: '#e3f2fd',
                        '&:hover': { backgroundColor: '#bbdefb' },
                      }),
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        color="success"
                        variant="dot"
                      >
                        <Avatar src={user.avatar} sx={{ bgcolor: '#2481cc' }}>
                          {user.name?.[0] || '?'}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">{user.name || 'Без имени'}</Typography>
                          {user.unread_count && user.unread_count > 0 && (
                            <Chip
                              label={user.unread_count}
                              size="small"
                              color="primary"
                              sx={{ minWidth: 20, height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          @{user.username || 'нет username'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>

          <Grid 
            item 
            xs={12} 
            md={8} 
            sx={{ 
              height: '100%',
              display: { xs: selectedUser ? 'flex' : 'none', md: 'flex' },
              flexDirection: 'column'
            }}
          >
            {selectedUser ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    sx={{ display: { md: 'none', xs: 'inline-flex' }, mr: 1 }}
                    onClick={() => setSelectedUser(null)}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Avatar src={selectedUser.avatar} sx={{ width: 40, height: 40, mr: 2, bgcolor: '#2481cc' }}>
                    {selectedUser.name?.[0] || '?'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedUser.name || 'Без имени'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{selectedUser.username || 'нет username'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f9f9f9' }}>
                  {messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary">
                        Нет сообщений. Начните диалог!
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            maxWidth: '70%',
                            backgroundColor: message.sender_id === currentUserId ? '#2481cc' : 'white',
                            color: message.sender_id === currentUserId ? 'white' : 'text.primary',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2">{message.text}</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7, mr: 0.5 }}>
                              {new Date(message.created_at).toLocaleTimeString().slice(0, 5)}
                            </Typography>
                            {message.sender_id === currentUserId && (
                              message.read ? (
                                <DoneAllIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                              ) : (
                                <CheckIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                              )
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'white' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Напишите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    InputProps={{
                      sx: { borderRadius: 2 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            color="primary"
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Выберите чат
                </Typography>
                <Typography variant="body2">
                  Начните общение с коллегой
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
