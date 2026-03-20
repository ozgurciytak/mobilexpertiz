import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Gerçek cihazlar (telefon/tablet) için bilgisayarın yerel IP adresi kullanılır.
const LOCAL_IP = '192.168.1.166';
const BASE_URL = 'https://mobilexpertiz.onrender.com/api';

// Logout callback - AuthContext tarafından set edilir
let _logoutCallback = null;
export const setLogoutCallback = (cb) => { _logoutCallback = cb; };

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 saniye (daha stabil)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: JWT token ekle
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 yönetimi + retry mantığı
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // 401 Unauthorized → token süresi dolmuş, logout yap
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      if (_logoutCallback) {
        _logoutCallback();
      }
      return Promise.reject(error);
    }

    // Network hatası veya timeout için retry mekanizması (maks 3 deneme)
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    const isNetworkError = !error.response; // timeout veya bağlantı hatası
    const isServerError = error.response?.status >= 500;

    if (!isNetworkError && !isServerError) {
      return Promise.reject(error); // 4xx hatalarını tekrar deneme
    }

    config.__retryCount = (config.__retryCount || 0) + 1;

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, config.__retryCount - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(`[API] Tekrar deneniyor (${config.__retryCount}/3): ${config.url}`);
    return apiClient(config);
  }
);

export default apiClient;
