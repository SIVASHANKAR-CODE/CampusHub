import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    // Clear legacy localStorage token so reopening site never auto-restores old session
    try { localStorage.removeItem('campushub_token'); } catch {}
    const token = sessionStorage.getItem('campushub_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      if (data.success) {
        setUser(data.data.user);
        setProfile(data.data.profile);
      }
    } catch {
      sessionStorage.removeItem('campushub_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  const login = useCallback(async (email, password) => {
    setError(null);
    // Let errors propagate to the caller (Login.jsx catch block)
    const { data } = await authAPI.login({ email, password });
    if (data.success) {
      sessionStorage.setItem('campushub_token', data.data.token);
      try { localStorage.removeItem('campushub_token'); } catch {}
      setUser(data.data.user);
      setProfile(data.data.profile);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    sessionStorage.removeItem('campushub_token');
    try { localStorage.removeItem('campushub_token'); } catch {}
    setUser(null);
    setProfile(null);
  }, []);

  const isRole = useCallback((...roles) => roles.includes(user?.role), [user?.role]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    login,
    logout,
    isRole,
    refreshProfile: loadCurrentUser,
  }), [user, profile, loading, error, login, logout, isRole, loadCurrentUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
