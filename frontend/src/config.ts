// Конфигурация API
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Эндпоинты
export const ENDPOINTS = {
  BASE_URL: API_URL,
  // ... остальные эндпоинты
}
// Эндпоинты
export const ENDPOINTS = {
  // Candidates
  CANDIDATES: `${API_URL}/api/candidates`,
  CANDIDATE_DETAIL: (id: number) => `${API_URL}/api/candidates/${id}`,
  CANDIDATE_STATUS: (id: number) => `${API_URL}/api/candidates/${id}/status`,
  CANDIDATE_COMMENTS: (id: number) => `${API_URL}/api/candidates/${id}/comments`,
  
  // Premium customization
  UPLOAD_ANIMATED_AVATAR: `${API_URL}/api/premium-profile/animated-avatar`,
  UPDATE_NICKNAME_STYLE: `${API_URL}/api/premium-profile/nickname-style`,
  ADD_NICKNAME_EMOJI: `${API_URL}/api/premium-profile/nickname-emoji`,
  SET_CUSTOM_BADGE: `${API_URL}/api/premium-profile/custom-badge`,
  PREMIUM_PREVIEW: `${API_URL}/api/premium-profile/preview`,
  
  // Partner program
  PARTNER_INFO: `${API_URL}/api/partner/my`,
  PARTNER_STATS: `${API_URL}/api/partner/stats`,
  PARTNER_LEADERBOARD: `${API_URL}/api/partner/leaderboard`,
  JOIN_PARTNER_PROGRAM: `${API_URL}/api/partner/join`,
  PARTNER_WITHDRAW: `${API_URL}/api/partner/withdraw`,
  
  // Teams
  MY_TEAM: `${API_URL}/api/teams/my`,
  CREATE_TEAM: `${API_URL}/api/teams/create`,
  INVITE_TO_TEAM: `${API_URL}/api/teams/invite`,
  LEAVE_TEAM: `${API_URL}/api/teams/leave`,
  DELETE_TEAM: `${API_URL}/api/teams/delete`,
  TEAM_MEMBER_ROLE: (id: number) => `${API_URL}/api/teams/members/${id}/role`,
  TEAM_MEMBER_REMOVE: (id: number) => `${API_URL}/api/teams/members/${id}`,
  
  // Subscriptions
  SUBSCRIPTION_PLANS: `${API_URL}/api/subscriptions/plans`,
  MY_SUBSCRIPTION: `${API_URL}/api/subscriptions/my`,
  SUBSCRIBE: (id: string) => `${API_URL}/api/subscriptions/subscribe/${id}`,
  CANCEL_SUBSCRIPTION: `${API_URL}/api/subscriptions/cancel`,
  SUBSCRIPTION_FEATURES: `${API_URL}/api/subscriptions/features`,

  // Notifications
  NOTIFICATIONS: `${API_URL}/api/notifications`,
  NOTIFICATIONS_UNREAD: `${API_URL}/api/notifications/unread-count`,
  NOTIFICATIONS_READ_ALL: `${API_URL}/api/notifications/read-all`,

  // Training
  TRAININGS: `${API_URL}/api/training`,
  MY_TRAININGS: `${API_URL}/api/training/my`,
  TRAINING_ACCESS: `${API_URL}/api/training/check-access`,
  TRAINING_START: (id: number) => `${API_URL}/api/training/${id}/start`,
  TRAINING_COMPLETE: (id: number) => `${API_URL}/api/training/${id}/complete`,

  // News
  NEWS: `${API_URL}/api/news`,
  NEWS_DETAIL: (id: number) => `${API_URL}/api/news/${id}`,
  NEWS_PIN: (id: number) => `${API_URL}/api/news/${id}/pin`,
  
  // Broadcast
  BROADCAST_SEND: `${API_URL}/api/broadcast/send`,
  BROADCAST_HISTORY: `${API_URL}/api/broadcast/history`,
  BROADCAST_DETAIL: (id: number) => `${API_URL}/api/broadcast/${id}`,

  // Candidate moderation
  CREATE_CANDIDATE: `${API_URL}/api/candidates/create`,
  CANDIDATE_APPROVE: (id: number) => `${API_URL}/api/candidates/${id}/approve`,
  CANDIDATE_REJECT: (id: number) => `${API_URL}/api/candidates/${id}/reject`,
  PENDING_CANDIDATES: `${API_URL}/api/candidates/pending`,
  MY_PENDING_CANDIDATES: `${API_URL}/api/candidates/my/pending`,

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
  
  // Referral system
  REFERRAL_GENERATE: `${API_URL}/api/referrals/generate`,
  REFERRAL_STATS: `${API_URL}/api/referrals/my`,
  REFERRAL_LIST: `${API_URL}/api/referrals/list`,
  REFERRAL_TOP: `${API_URL}/api/referrals/top`,
  REFERRAL_USE: `${API_URL}/api/referrals/use`,

  // Files - НОВЫЕ ЭНДПОИНТЫ (внутри объекта!)
  UPLOAD_FILE: `${API_URL}/api/files/upload`,
  CANDIDATE_FILES: (id: number) => `${API_URL}/api/files/candidate/${id}`,
  DOWNLOAD_FILE: (id: number) => `${API_URL}/api/files/download/${id}`,
  DELETE_FILE: (id: number) => `${API_URL}/api/files/${id}`,
};

