import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'USER';
  mustChangePassword: boolean;
  assignedProjects?: string[]; // Array de proyectos asignados
}

interface AuthContextType {
  userToken: string | null;
  user: UserProfile | null;
  activeProject: string | null;
  isLoading: boolean;
  setActiveProject: (project: string | null) => void;
  signIn: (token: string, user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await storage.getItem('userToken');
        const userData = await storage.getItem('userData');
        const savedProject = await storage.getItem('activeProject');
        
        if (token) {
          setUserToken(token);
        }
        if (userData) {
          setUser(JSON.parse(userData));
        }
        if (savedProject) {
          setActiveProject(savedProject);
        }

        // Register notifications if already logged in
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          registerForPushNotificationsAsync(parsedUser.id);
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
      setActiveProject(null); // Resetea el proyecto al iniciar sesión
      await storage.removeItem('activeProject');
      
      // Register for push notifications
      registerForPushNotificationsAsync(userProfile.id);
    } catch (e) {
      console.error('Failed to save token or user data', e);
    }
  };

  const handleSetActiveProject = async (project: string | null) => {
    try {
      if (project) {
        await storage.setItem('activeProject', project);
      } else {
        await storage.removeItem('activeProject');
      }
      setActiveProject(project);
    } catch (e) {
      console.error('Failed to set active project', e);
    }
  };

  const signOut = async () => {
    try {
      await storage.removeItem('userToken');
      await storage.removeItem('userData');
      await storage.removeItem('activeProject');
      setUserToken(null);
      setUser(null);
      setActiveProject(null);
    } catch (e) {
      console.error('Failed to delete token or user data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, activeProject, isLoading, setActiveProject: handleSetActiveProject, signIn, signOut }}>
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
