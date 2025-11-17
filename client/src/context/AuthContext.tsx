import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { LoginRequest } from '../models/loginRequest';
import { AuthContextType } from '../models/AuthContextType';
import { CONSTANTS } from '../constants/contstants';
import { authService } from '../services/authService';
import { getTokenRoles } from '../utils/tokenUtils';
import { UserRole } from '../models/UserRole';

interface AuthProviderProps {
  children: ReactNode;
}

// Create a global logout callback that can be accessed outside React
let globalLogoutCallback: (() => void) | null = null;

export const setGlobalLogoutCallback = (callback: (() => void) | null) => {
  globalLogoutCallback = callback;
};

export const getGlobalLogoutCallback = () => globalLogoutCallback;

const defaultAuthContext: AuthContextType = {
  token: null,
  saveToken: (token: string) => { },
  login: async () => { },
  logout: () => { },
  userRoles: [] as UserRole[],
  isAuthenticated: false
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME));

  const login = async (credentials: LoginRequest) => {
    const token: string = await authService.login(credentials);
    saveToken(token);
  };

  const saveToken = (token: string) => {
    setToken(token);
    localStorage.setItem(CONSTANTS.TOKEN_VARIABLE_NAME, token);
  }

  const logout = () => {
    setToken(null);
    localStorage.removeItem(CONSTANTS.TOKEN_VARIABLE_NAME);
  };

  // Set the global logout callback when the provider mounts
  useEffect(() => {
    setGlobalLogoutCallback(logout);
    return () => setGlobalLogoutCallback(null);
  }, []);

  // Get user roles based on current token
  const userRoles = token ? getTokenRoles() : [];

  return (
    <AuthContext.Provider value={{
      token,
      saveToken,
      login,
      logout,
      isAuthenticated: !!token,
      userRoles: userRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);