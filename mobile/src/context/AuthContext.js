import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setLogoutCallback } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // logoutRef sayesinde interceptor stale closure yakalamaz
  const logoutRef = useRef(null);

  useEffect(() => {
    loadUser();

    // Axios 401 interceptor'ına logout callback'i bağla
    setLogoutCallback(() => {
      if (logoutRef.current) {
        logoutRef.current();
      }
    });
  }, []);

  // logoutRef'i her render'da güncelle
  useEffect(() => {
    logoutRef.current = logout;
  });

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.' 
      };
    }
  };

  const register = async (email, password, name, phone, tcNo, city, role) => {
    try {
      const response = await apiClient.post('/auth/register', { 
        email, 
        password, 
        name, 
        phone, 
        tcNo,
        city,
        role 
      });
      const { token, user: userData } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Register error', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edin.' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
