"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types
type User = {
  id: number;
  username: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    // Clear any previous state to ensure a fresh login attempt
    setUser(null);
    setIsLoading(true);
    
    try {
      // Add cache-busting parameter to prevent fetch caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/auth/login?_=${timestamp}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Prevent caching
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Set user in state and local storage
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Clear all auth state
    setUser(null);
    localStorage.removeItem('user');
    
    // Force a small delay to ensure state is properly cleared
    // This prevents rapid logout/login issues
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
