'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'staff' | 'parent' | string;
  parent_id?: number | null;
  subject?: string | null;
  teacher_id?: number | null;
}

interface RegisterParentData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  nis?: string;
  studentId?: number;
  studentName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerParent: (data: RegisterParentData) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post('/login', { email, password });
    const { access_token, user: loggedUser } = response.data;

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(loggedUser));

    setToken(access_token);
    setUser(loggedUser);

    return loggedUser;
  };

  const registerParent = async (data: RegisterParentData): Promise<User> => {
    const response = await api.post('/register', data);
    const { access_token, user: registeredUser } = response.data;

    if (access_token) {
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setToken(access_token);
      setUser(registeredUser);
    }

    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
