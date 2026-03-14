import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

import { ENDPOINTS } from '../config';
import { useFetch } from '../hooks/useApi';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface Candidate {
  id: number;
  candidate_id: string;
  name: string;
  username: string;
  keywords: string;
  status: 'new' | 'contacted' | 'interview' | 'hired' | 'rejected';
  found_date: string;
  chat: string;
  message_link: string;
  message_text: string;
  contacts: string;
  comments_count: number;
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  new: { bg: '#e3f2fd', color: '#1976d2', label: '🆕 Новый' },
  contacted: { bg: '#fff3e0', color: '#ed6c02', label: '📞 Связались' },
  interview: { bg: '#f3e5f5', color: '#9c27b0', label: '📅 Интервью' },
  hired: { bg: '#e8f5e8', color: '#2e7d32', label: '🎯 Нанят' },
  rejected: { bg: '#ffebee', color: '#d32f2f', label: '❌ Отказ' },
};

export default function Candidates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();

  const { data: candidates, isLoading, isError, error, refetch } = useFetch<Candidate[]>(
    ENDPOINTS.CANDIDATES,
    { autoFetch: true, initialData: [] }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const statusMap = ['all', 'new', 'contacted', 'interview', 'hired', 'rejected'];
    setStatusFilter(statusMap[newValue]);
  };

  const filteredCandidates = Array.isArray(candidates) 
    ? candidates.filter((c: Candidate) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          c.name?.toLowerCase().includes(searchLower) ||
          (c.keywords && c.keywords.toLowerCase().includes(searchLower));
        const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  const sortedCandidates = [...filteredCandidates].sort((a: Candidate, b: Candidate) => {
    if (sortBy === 'date') {
      return new Date(b.found_date).getTime() - new Date(a.found_date).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.found_date).getTime() - new Date(b.found_date).getTime();
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const paginatedCandidates = sortedCandidates.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusChip = (status: string) => {
    const config = statusColors[status] || statusColors.new;
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 500,
        }}
      />
    );
  };

  if (isLoading) {
    return <LoadingState type="list" count={5} />;
  }

  if (isError) {
    return (
      <ErrorState 
        error={error || undefined}
        title="Ошибка загрузки кандидатов"
        message="Не удалось загрузить список кандидатов"
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          👥 Кандидаты
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/candidates/add')}
          sx={{ borderRadius: 2 }}
        >
          Добавить
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Все" />
        <Tab label="🆕 Новые" />
        <Tab label="📞 В работе" />
        <Tab label="📅 Интервью" />
        <Tab label="🎯 Нанятые" />
        <Tab label="❌ Отказы" />
      </Tabs>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Поиск по имени или навыкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={sortBy}
              label="Сортировка"
              onChange={(e) => setSortBy(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="date">По дате ↓</MenuItem>
              <MenuItem value="date_asc">По дате ↑</MenuItem>
              <MenuItem value="name">По имени</MenuItem>
              <MenuItem value="status">По статусу</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {}}
            sx={{ height: '56px', borderRadius: 2 }}
          >
            Фильтры
          </Button>
        </Grid>
      </Grid>

      {!paginatedCandidates || paginatedCandidates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Кандидаты не найдены
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedCandidates.map((candidate: Candidate) => (
              <Grid item xs={12} key={candidate.id}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{ width: 48, height: 48, bgcolor: '#2481cc' }}
                          >
                            {candidate.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {candidate.name || 'Без имени'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {candidate.username ? `@${candidate.username}` : 'нет username'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {candidate.keywords && candidate.keywords.split(',').slice(0, 3).map((kw: string, i: number) => (
                            <Chip
                              key={i}
                              label={kw.trim()}
                              size="small"
                              sx={{ backgroundColor: '#e0e0e0' }}
                            />
                          ))}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        {getStatusChip(candidate.status)}
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(candidate.found_date).toLocaleDateString()}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (candidate.message_link) {
                                window.open(candidate.message_link, '_blank');
                              }
                            }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {sortedCandidates.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(sortedCandidates.length / itemsPerPage)}
                page={page}
                onChange={(e: React.ChangeEvent<unknown>, value: number) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
