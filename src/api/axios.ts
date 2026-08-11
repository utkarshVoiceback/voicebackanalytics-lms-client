import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token from localStorage to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token'); // token stored in localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors and clear localStorage on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('lms_token'); // clear token from localStorage
      localStorage.removeItem('lms_user'); // clear user data from localStorage
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
