import axios from 'axios';

// When deployed: frontend and backend are same server
// so we use relative /api path — no CORS, no cross-origin issues
// When local dev: use localhost:8000
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;
