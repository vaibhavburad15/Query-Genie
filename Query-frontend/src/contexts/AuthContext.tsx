// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, sendOtp as apiSendOtp, logout as apiLogout } from '@/services/api';
import { clearDbSessionToken } from '@/services/apiClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  contactNumber?: string;
  gender: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  justLoggedIn: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<boolean>;
  signup: (userData: {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    password: string;
    otp: string;
    username: string;
  }) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  logout: () => void;
  resetJustLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Rehydrate from localStorage on mount (only user data, not token)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');
    
    if (storedUser && storedAuth === 'true') {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    } else if (storedUser || storedAuth === 'true') {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
  }, []);

  const login = async (credentials: { identifier: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiLogin(credentials);
      // Auth token is now in HttpOnly cookie - no need to store it
      if (response.success && response.user) {
        const userData: User = response.user;
        setUser(userData);
        setIsAuthenticated(true);
        setJustLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    password: string;
    otp: string;
    username: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiSignup(userData);

      // Backend now returns the user object on successful signup
      // Auth token is in HttpOnly cookie
      if (response.success && response.user) {
        const newUser: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          username: response.user.username,
          contactNumber: response.user.contactNumber ?? '',
          gender: response.user.gender,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        setJustLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    try {
      const response = await apiSendOtp({ email });
      return response.success;
    } catch (error) {
      console.error('Send OTP error:', error);
      return false;
    }
  };

  const resetJustLoggedIn = () => setJustLoggedIn(false);

  const logout = () => {
    void apiLogout().catch(() => undefined);
    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    // Auth token cookie is cleared by backend
    // Clear the per-user DB session token so it isn't reused after logout
    clearDbSessionToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        justLoggedIn,
        login,
        signup,
        sendOtp,
        logout,
        resetJustLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
