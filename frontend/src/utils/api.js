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
