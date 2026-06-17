// API Configuration for Civiconnect
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  UPLOAD_BASE: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', ''),
  ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    REPORTS: '/reports',
    REPORTS_MY: '/reports/my',
    REPORTS_ADMIN: '/reports/admin',
    REPORTS_COMMUNITY: '/reports/community',
    REPORT_BY_ID: (id: string) => `/reports/${id}`,
    SUBMIT_FEEDBACK: (id: string) => `/reports/${id}/feedback`,
    TOGGLE_SUPPORT: (id: string) => `/reports/${id}/support`,
    NOTIFICATIONS: '/reports/notifications',
    NOTIFICATION_READ: (id: string) => `/reports/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/reports/notifications/read-all',
    ANALYTICS_STATS: '/reports/analytics/stats',
    ANALYTICS_ADVANCED: '/reports/analytics/advanced',
    ANALYTICS_GEOSPATIAL: '/reports/analytics/geospatial',
    STAFF_DASHBOARD: '/staff/dashboard',
    STAFF_MEMBERS: '/staff/members',
    ASSIGN_REPORT: (id: string) => `/staff/reports/${id}/assign`,
    UPDATE_STATUS: (id: string) => `/staff/reports/${id}/status`,
    UPDATE_PRIORITY: (id: string) => `/staff/reports/${id}/priority`,
    ADD_COMMENT: (id: string) => `/staff/reports/${id}/comment`,
  }
};

export const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

export const getUploadHeaders = (token?: string) => ({
  ...(token && { Authorization: `Bearer ${token}` }),
});

export default API_CONFIG;
