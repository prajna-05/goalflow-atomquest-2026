import axios from 'axios';

// Uses env variable — works for both local and deployed
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
  return Promise.reject(err);
});

export default api;
