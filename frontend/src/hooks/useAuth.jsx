import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sampleAdmin, setSampleAdmin] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const sample = api.ensureSampleAdmin ? api.ensureSampleAdmin() : null;
      if (sample) setSampleAdmin(sample);
      const res = await api.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (mobile, password) => {
    const res = await api.login({ mobile, password });
    setUser({
      mobile: res.data.mobile,
      name: res.data.name,
      roles: res.data.roles
    });
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roleId) => Boolean(user && Array.isArray(user.roles) && user.roles.indexOf(roleId) >= 0),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      sampleAdmin,
      signedIn: Boolean(user),
      isPssmAdmin: hasRole('pssm_admin'),
      isOrganizer: hasRole('event_organizer'),
      hasRole,
      login,
      logout,
      refresh
    }),
    [user, loading, sampleAdmin, hasRole, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
