import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('slf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('slf_token');
      localStorage.removeItem('slf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// ── AI Chat API helpers ──────────────────────────────────────────────────────

export const sendChatMessage = (message, sessionId = null, subject = null) =>
  API.post('/chat/message', { message, sessionId, subject }, { timeout: 60000 });

export const uploadChatFile = (file, sessionId = null, prompt = '') => {
  const form = new FormData();
  form.append('file', file);
  if (sessionId) form.append('sessionId', sessionId);
  if (prompt) form.append('prompt', prompt);
  return API.post('/chat/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000,
  });
};

export const getChatSessions = () => API.get('/chat/sessions');

export const getChatSession = (id) => API.get(`/chat/sessions/${id}`);

export const deleteChatSession = (id) => API.delete(`/chat/sessions/${id}`);
