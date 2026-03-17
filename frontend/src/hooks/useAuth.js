import { useState, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * JWT認証状態とログイン/ログアウト操作を提供するフック。
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('accessToken')
  );

  const login = useCallback(async ({ email, password }) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}