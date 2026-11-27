import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setActiveAgencyHeader, setAuthToken } from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
}

export interface AgencyWorkspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  currentAgency: AgencyWorkspace | null;
  availableAgencies: AgencyWorkspace[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    agencyName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (agencyId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgency, setCurrentAgency] = useState<AgencyWorkspace | null>(null);
  const [availableAgencies, setAvailableAgencies] = useState<AgencyWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await apiRequest<{
        user: User;
        currentAgency: AgencyWorkspace | null;
        availableAgencies: AgencyWorkspace[];
      }>('/api/v1/auth/me');

      setUser(data.user);
      setCurrentAgency(data.currentAgency);
      setAvailableAgencies(data.availableAgencies || []);
      if (data.currentAgency) {
        setActiveAgencyHeader(data.currentAgency.id);
      }
    } catch {
      setUser(null);
      setCurrentAgency(null);
      setAvailableAgencies([]);
      setActiveAgencyHeader(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{
      user: User;
      currentAgency: AgencyWorkspace | null;
      availableAgencies: AgencyWorkspace[];
      token?: string;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    setCurrentAgency(data.currentAgency);
    setAvailableAgencies(data.availableAgencies || []);
    if (data.currentAgency) {
      setActiveAgencyHeader(data.currentAgency.id);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    agencyName: string;
  }) => {
    const data = await apiRequest<{
      user: User;
      currentAgency: AgencyWorkspace;
      token?: string;
    }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    setCurrentAgency(data.currentAgency);
    setAvailableAgencies([data.currentAgency]);
    setActiveAgencyHeader(data.currentAgency.id);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setCurrentAgency(null);
      setAvailableAgencies([]);
      setActiveAgencyHeader(null);
      setAuthToken(null);
    }
  };

  const switchWorkspace = async (agencyId: string) => {
    setActiveAgencyHeader(agencyId);
    const target = availableAgencies.find((a) => a.id === agencyId);
    if (target) {
      setCurrentAgency(target);
    }
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentAgency,
        availableAgencies,
        isLoading,
        login,
        register,
        logout,
        switchWorkspace,
        refreshProfile,
      }}
    >
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
