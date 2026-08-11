import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api/axios';
import { SafeUser } from '../types';

interface AuthContextValue {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() => {
    const stored = localStorage.getItem('lms_user');
    return stored ? (JSON.parse(stored) as SafeUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: SafeUser }>('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('lms_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<SafeUser> {
    const res = await api.post<{ token: string; user: SafeUser }>('/auth/login', { email, password });
    localStorage.setItem('lms_token', res.data.token);
    localStorage.setItem('lms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout(): void {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
