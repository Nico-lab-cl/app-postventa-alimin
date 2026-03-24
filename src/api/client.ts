import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const API_BASE_URL = Platform.OS === 'web' ? '/api' : (process.env.EXPO_PUBLIC_API_URL || 'https://aliminlomasdelmar.com/api/');

const apiClient = axios.create({
  baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
