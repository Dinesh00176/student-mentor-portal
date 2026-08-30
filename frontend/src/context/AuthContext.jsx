import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('smcs_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [profileId, setProfileId] = useState(() => localStorage.getItem('smcs_profile_id') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smcs_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(({ data }) => {
        setUser(data.data.user);
        setProfileId(data.data.profileId);
        localStorage.setItem('smcs_user', JSON.stringify(data.data.user));
      })
      .catch(() => {
        localStorage.removeItem('smcs_token');
        localStorage.removeItem('smcs_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    const { token, user: loggedInUser, profileId: pid } = data.data;
    localStorage.setItem('smcs_token', token);
    localStorage.setItem('smcs_user', JSON.stringify(loggedInUser));
    if (pid) localStorage.setItem('smcs_profile_id', pid);
    setUser(loggedInUser);
    setProfileId(pid);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('smcs_token');
    localStorage.removeItem('smcs_user');
    localStorage.removeItem('smcs_profile_id');
    setUser(null);
    setProfileId(null);
  }, []);

  const value = useMemo(
    () => ({ user, profileId, loading, login, logout, isAuthenticated: !!user }),
    [user, profileId, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
