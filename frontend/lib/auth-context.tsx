// lib/auth-context.tsx
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, User, AuthResponse } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.me();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token inválido, limpiar
            apiService.removeToken();
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          apiService.removeToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        setUser(response.data.user);
        apiService.setToken(response.data.token);
        return { success: true, user: response.data.user };
      } else {
        return { 
          success: false, 
          error: response.error || response.message || 'Error al iniciar sesión' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Error de conexión con el servidor' 
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register({ name, email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        apiService.setToken(response.data.token);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || response.message || 'Error al registrarse' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Error de conexión con el servidor' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      apiService.removeToken();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
