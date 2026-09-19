import { createContext, useContext, useState, useCallback } from 'react';

const API_BASE = 'http://localhost:4000/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('sahkaar-auth');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, role: null, userId: null, token: null, user: null };
  });

  const login = useCallback((role, userId, token = null, user = null) => {
    const newAuth = { isAuthenticated: true, role, userId, token, user };
    setAuth(newAuth);
    localStorage.setItem('sahkaar-auth', JSON.stringify(newAuth));
  }, []);

  const logout = useCallback(() => {
    const newAuth = { isAuthenticated: false, role: null, userId: null, token: null, user: null };
    setAuth(newAuth);
    localStorage.removeItem('sahkaar-auth');
  }, []);

  const getUser = useCallback(() => {
    return auth.user || null;
  }, [auth]);

  // Helper for API calls with auth token
  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    return res.json();
  }, [auth.token]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, getUser, apiFetch, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
