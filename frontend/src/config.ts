// Конфигурация API
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Эндпоинты
export const ENDPOINTS = {
  // Candidates
  CANDIDATES: `${API_URL}/api/candidates`,
  CANDIDATE_DETAIL: (id: number) => `${API_URL}/api/candidates/${id}`,
  CANDIDATE_STATUS: (id: number) => `${API_URL}/api/candidates/${id}/status`,
  CANDIDATE_COMMENTS: (id: number) => `${API_URL}/api/candidates/${id}/comments`,
  
  // Statistics
  STATISTICS: `${API_URL}/api/statistics`,
  LEADERBOARD: `${API_URL}/api/statistics/leaderboard`,
  
  // Tasks
  TASKS: `${API_URL}/api/tasks`,
  TASK_COMPLETE: (id: number) => `${API_URL}/api/tasks/${id}/complete`,
  
  // Chat
  CHAT_USERS: `${API_URL}/api/chat/users`,
  CHAT_MESSAGES: (userId: number) => `${API_URL}/api/chat/messages/${userId}`,
  CHAT_SEND: `${API_URL}/api/chat/send`,
  CHAT_READ: (userId: number) => `${API_URL}/api/chat/read/${userId}`,
  
  // Profile
  PROFILE: `${API_URL}/api/profile`,
  PROFILE_STATS: `${API_URL}/api/profile/stats`,
  
  // Admin
  ADMIN_STATS: `${API_URL}/api/admin/stats`,
  ADMIN_SCOUTS: `${API_URL}/api/admin/scouts`,
  ADMIN_SCOUT_TOGGLE: (id: number) => `${API_URL}/api/admin/scouts/${id}/toggle`,
};
