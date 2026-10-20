import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi, setAuthToken, clearAuthToken, getAuthToken } from '../api';

export interface User {
  id: string;
  businessId: string;
  email: string;
  name: string;
  role: string;
  businessName?: string;
}

interface AuthContextType {
  user: User | null;
  businessName: string;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateBusinessName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [businessName, setBusinessName] = useState<string>('My Store');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchApi('/auth/me');
        setUser({
          id: data.user.id,
          businessId: data.user.business_id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          businessName: data.user.business_name
        });
        if (data.user.business_name) {
          setBusinessName(data.user.business_name);
        }
      } catch (err) {
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    if (userData.businessName) setBusinessName(userData.businessName);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const updateBusinessName = (name: string) => {
    setBusinessName(name);
  };

  return (
    <AuthContext.Provider value={{ user, businessName, loading, login, logout, updateBusinessName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
