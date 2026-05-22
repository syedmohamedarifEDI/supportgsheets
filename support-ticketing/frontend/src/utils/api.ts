import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-supportgsheets.onrender.com',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const isLoginRoute = window.location.pathname === '/login';
      if (!isLoginRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
