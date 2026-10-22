import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('docnest_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getMe(token);
          setUser(userData);
        } catch (err) {
          console.warn('[Auth] Token validation failed, clearing session');
          localStorage.removeItem('docnest_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('docnest_token', response.token);
      setToken(response.token);
      const role = response.role || 'EMPLOYEE';
      const baseUser = {
        email: response.email,
        fullName: response.fullName,
        role,
        assignedOffice: response.assignedOffice ?? null,
      };
      // For CLIENT role, fetch full user data (including linkedClient)
      if (role === 'CLIENT') {
        try {
          const me = await authService.getMe(response.token);
          setUser({ ...baseUser, id: me.id, linkedClient: me.linkedClient });
        } catch {
          setUser(baseUser);
        }
      } else {
        setUser(baseUser);
      }
      return response;
    } catch (err) {
      // The centralized API interceptor already provides user-friendly messages
      // for network/CORS errors. Only extract server-side messages here.
      const message = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data
        || err.message
        || 'Unable to connect to server. Please try again in a few seconds.';
      throw new Error(typeof message === 'string' ? message : 'Invalid credentials');
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      localStorage.setItem('docnest_token', response.token);
      setToken(response.token);
      const role = response.role || 'EMPLOYEE';
      const baseUser = {
        email: response.email,
        fullName: response.fullName,
        role,
        assignedOffice: response.assignedOffice ?? null,
      };
      // CLIENT role — fetch full user data including linkedClient
      if (role === 'CLIENT') {
        try {
          const me = await authService.getMe(response.token);
          setUser({ ...baseUser, id: me.id, linkedClient: me.linkedClient });
        } catch {
          setUser(baseUser);
        }
      } else {
        setUser(baseUser);
      }
      return response;
    } catch (err) {
      const message = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data
        || err.message
        || 'Unable to connect to server. Please try again in a few seconds.';
      throw new Error(typeof message === 'string' ? message : 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('docnest_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
