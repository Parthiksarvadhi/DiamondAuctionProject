// src/services/configs/baseService.ts
import axios from 'axios';
import appConfig from './app.config';

const api = axios.create({
  baseURL: appConfig.apiPrefix,
  timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(appConfig.auth.tokenKey);
  if (token) {
    config.headers.Authorization = `${appConfig.auth.tokenType}${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(appConfig.auth.tokenKey);
      localStorage.removeItem(appConfig.auth.refreshTokenKey);
      localStorage.removeItem('user');
      if (window.location.pathname !== appConfig.unAuthenticatedEntryPath) {
        window.location.href = appConfig.unAuthenticatedEntryPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;