'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'viewer' | 'manager' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (action: string) => boolean;
  canAccessAdmin: () => boolean;
  canAccessDataManagement: () => boolean;
  canEditProjects: () => boolean;
  canViewAnalytics: () => boolean;
  canDeleteData: () => boolean;
  canDeleteStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      // Clear corrupted data if parsing fails
      localStorage.removeItem('user');
    } finally {
      // This ensures loading is false after the initial check, preventing a stuck state
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: userData, token } = await response.json();
        const userWithRole: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role || 'viewer',
          name: userData.name,
        };
        
        setUser(userWithRole);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        localStorage.setItem('token', token); // Store the token
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Remove the token on logout
    window.location.href = '/login';
  };

  // Permission checking functions
  const hasPermission = (action: string): boolean => {
    if (!user) return false;

    const permissions = {
      viewer: {
        view_projects: true,
        view_analytics: true,
        edit_projects: false,
        delete_projects: false,
        access_admin: false,
        access_data_management: false,
        delete_data: false,
        delete_status: false,
      },
      manager: {
        view_projects: true,
        view_analytics: true,
        edit_projects: true,
        delete_projects: true,
        access_admin: false,
        access_data_management: true,
        delete_data: true,
        delete_status: false,
      },
      admin: {
        view_projects: true,
        view_analytics: true,
        edit_projects: true,
        delete_projects: true,
        access_admin: true,
        access_data_management: true,
        delete_data: true,
        delete_status: true,
      },
    };

    return permissions[user.role]?.[action] || false;
  };

  const canAccessAdmin = (): boolean => hasPermission('access_admin');
  const canAccessDataManagement = (): boolean => hasPermission('access_data_management');
  const canEditProjects = (): boolean => hasPermission('edit_projects');
  const canViewAnalytics = (): boolean => hasPermission('view_analytics');
  const canDeleteData = (): boolean => hasPermission('delete_data');
  const canDeleteStatus = (): boolean => hasPermission('delete_status');

  const value: AuthContextType = {
    user,
    loading,
    role: user?.role || null,
    login,
    logout,
    hasPermission,
    canAccessAdmin,
    canAccessDataManagement,
    canEditProjects,
    canViewAnalytics,
    canDeleteData,
    canDeleteStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
