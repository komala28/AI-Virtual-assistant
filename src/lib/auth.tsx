import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, UserSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    settings: null,
    loading: true,
  });

  const loadProfile = useCallback(async (uid: string) => {
    const [pRes, sRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('user_settings').select('*').eq('id', uid).maybeSingle(),
    ]);
    setState((prev) => ({
      ...prev,
      profile: (pRes.data as Profile) || null,
      settings: (sRes.data as UserSettings) || null,
    }));
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        setState({
          user: { id: data.session.user.id, email: data.session.user.email || '' },
          profile: null,
          settings: null,
          loading: true,
        });
        loadProfile(data.session.user.id).finally(() => {
          if (mounted) setState((prev) => ({ ...prev, loading: false }));
        });
      } else {
        setState({ user: null, profile: null, settings: null, loading: false });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setState({ user: null, profile: null, settings: null, loading: false });
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setState({
            user: { id: session.user.id, email: session.user.email || '' },
            profile: null,
            settings: null,
            loading: true,
          });
          await loadProfile(session.user.id);
          setState((prev) => ({ ...prev, loading: false }));
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, settings: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) await loadProfile(state.user.id);
  }, [state.user, loadProfile]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    if (!state.user) return;
    const merged = { ...state.settings, ...patch, id: state.user.id };
    setState((prev) => ({ ...prev, settings: merged as UserSettings }));
    await supabase.from('user_settings').upsert(merged);
  }, [state.user, state.settings]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!state.user) return;
    const merged = { ...state.profile, ...patch, id: state.user.id, email: state.user.email };
    setState((prev) => ({ ...prev, profile: merged as Profile }));
    await supabase.from('profiles').upsert(merged);
  }, [state.user, state.profile]);

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, refreshProfile, updateSettings, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { DEFAULT_SETTINGS };
