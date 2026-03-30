import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'USER';
  mustChangePassword: boolean;
}

interface AuthContextType {
  userToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (token: string, user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await storage.getItem('userToken');
        const userData = await storage.getItem('userData');
        if (token) {
          setUserToken(token);
        }
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('Failed to load token or user data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async (token: string, userProfile: UserProfile) => {
    try {
      await storage.setItem('userToken', token);
      await storage.setItem('userData', JSON.stringify(userProfile));
      setUserToken(token);
      setUser(userProfile);
    } catch (e) {
      console.error('Failed to save token or user data', e);
    }
  };

  const signOut = async () => {
    try {
      await storage.removeItem('userToken');
      await storage.removeItem('userData');
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to delete token or user data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
