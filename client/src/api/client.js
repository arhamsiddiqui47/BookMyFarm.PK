import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

// Attach the saved login token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err) {
  return err?.response?.data?.message || 'Something went wrong. Please try again.';
}

export default api;
