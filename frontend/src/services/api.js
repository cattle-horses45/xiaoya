import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // Longer timeout for AI chat
});

// Request interceptor: attach JWT token and session token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionToken = localStorage.getItem('session_token');
  if (sessionToken) {
    config.headers['X-Session-Token'] = sessionToken;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
