// Брендинг компании Every Scouting
export const BRAND = {
  // Названия
  COMPANY_NAME: 'Every Scouting',
  COMPANY_NAME_SHORT: 'ES',
  NEWS_NAME: 'Every News',
  
  // Логотип
  LOGO_TEXT: 'ES',
  LOGO_FULL: 'Every Scouting',
  
  // Цвета бренда
  colors: {
    primary: '#2481cc',
    secondary: '#ff6b6b',
    accent: '#4da3e0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
  
  // Градиенты
  gradients: {
    primary: 'linear-gradient(135deg, #2481cc 0%, #4da3e0 100%)',
    secondary: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
  },
  
  // Тексты
  texts: {
    welcome: 'Добро пожаловать в Every Scouting',
    tagline: 'Ваш надежный партнер в поиске талантов',
    newsTitle: 'Every News - новости компании',
  },
  
  // Версии
  version: '2.0.0',
  
  // Социальные сети
  social: {
    telegram: 'https://t.me/every_scouting',
    instagram: 'https://instagram.com/every_scouting',
    website: 'https://every-scouting.com',
  },
};

// Статусы кандидатов
export const CANDIDATE_STATUSES = {
  new: {
    value: 'new',
    label: '🆕 Новый',
    color: '#1976d2',
    bgColor: '#e3f2fd',
    icon: 'pending',
    nextSteps: ['approve', 'reject'],
  },
  approved: {
    value: 'approved',
    label: '✅ Анкета одобрена',
    color: '#2e7d32',
    bgColor: '#e8f5e8',
    icon: 'check_circle',
    nextSteps: ['schedule_interview'],
  },
  rejected: {
    value: 'rejected',
    label: '❌ Анкета отказана',
    color: '#d32f2f',
    bgColor: '#ffebee',
    icon: 'cancel',
    nextSteps: [],
  },
  interview_scheduled: {
    value: 'interview_scheduled',
    label: '📅 Назначено собеседование',
    color: '#ed6c02',
    bgColor: '#fff3e0',
    icon: 'event',
    nextSteps: ['candidate_came', 'candidate_reject', 'partner_reject'],
  },
  candidate_rejected: {
    value: 'candidate_rejected',
    label: '❌ Отказ кандидата',
    color: '#d32f2f',
    bgColor: '#ffebee',
    icon: 'cancel',
    nextSteps: [],
  },
  partner_rejected: {
    value: 'partner_rejected',
    label: '❌ Отказ партнера',
    color: '#d32f2f',
    bgColor: '#ffebee',
    icon: 'cancel',
    nextSteps: [],
  },
  registered: {
    value: 'registered',
    label: '📝 Регистрация',
    color: '#2e7d32',
    bgColor: '#e8f5e8',
    icon: 'check_circle',
    nextSteps: ['add_shift'],
  },
  successful: {
    value: 'successful',
    label: '🏆 Успешно',
    color: '#ed6c02',
    bgColor: '#fff3e0',
    icon: 'emoji_events',
    nextSteps: [],
  },
} as const;

// Типы уведомлений
export const NOTIFICATION_TYPES = {
  candidate_status: {
    label: 'Изменение статуса',
    icon: 'info',
  },
  candidate_approved: {
    label: 'Кандидат одобрен',
    icon: 'check_circle',
    color: 'success',
  },
  candidate_rejected: {
    label: 'Кандидат отклонен',
    icon: 'cancel',
    color: 'error',
  },
  interview_scheduled: {
    label: 'Собеседование назначено',
    icon: 'event',
    color: 'info',
  },
  candidate_hired: {
    label: 'Новый найм',
    icon: 'emoji_events',
    color: 'warning',
  },
  training: {
    label: 'Обучение',
    icon: 'school',
    color: 'primary',
  },
  referral: {
    label: 'Реферальная система',
    icon: 'people',
    color: 'secondary',
  },
} as const;

// Роли пользователей
export const USER_ROLES = {
  admin: {
    label: 'Администратор',
    color: 'primary',
    icon: 'admin_panel_settings',
  },
  scout: {
    label: 'Скаут',
    color: 'default',
    icon: 'person',
  },
} as const;

// Настройки конверсии
export const CONVERSION_CONFIG = {
  minShiftsForSuccess: 2, // Минимальное количество смен для статуса "успешно"
  successStatus: 'successful',
  registeredStatus: 'registered',
} as const;

// API эндпоинты с брендингом
export const BRANDED_ENDPOINTS = {
  news: '/api/news',
  successfulCandidates: '/api/candidates/successful',
  conversionStats: '/api/statistics/conversion',
} as const;
