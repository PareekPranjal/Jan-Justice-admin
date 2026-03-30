import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jan-justice-bancked.onrender.com/api';
const API_BASE_URL = 'http://localhost:5001/api';

interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem('admin_token');
      if (!stored) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        const data = await res.json();
        if (res.ok && data.user?.role === 'admin') {
          setUser(data.user);
          setToken(stored);
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('admin_token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.user?.role !== 'admin') throw new Error('Access denied. Admin accounts only.');
    localStorage.setItem('admin_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
