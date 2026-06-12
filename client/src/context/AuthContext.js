import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleDeactivated = () => {
      setUser(null);
      toast.error('Your account has been deactivated by an administrator.', { autoClose: 5000 });
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    };
    window.addEventListener('auth:deactivated', handleDeactivated);
    return () => window.removeEventListener('auth:deactivated', handleDeactivated);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    window.location.href = '/login';
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
