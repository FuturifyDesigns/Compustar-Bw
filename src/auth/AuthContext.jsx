import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { assertClientCooldown } from '../lib/clientSecurity';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const user = session?.user || null;
  const isAdmin = profile?.role === 'admin';
  const isCustomer = Boolean(user) && !isAdmin;

  async function loadProfile(userId) {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
    return data;
  }

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) await loadProfile(next.user.id);
      else {
        setProfile(null);
        setMessage('');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp({ email, password, fullName, phone }) {
    if (!supabase) throw new Error('Supabase is not configured');
    const cooldown = assertClientCooldown('auth-signup', 30_000);
    if (!cooldown.ok) throw new Error(cooldown.error);
    setBusy(true);
    setMessage('');
    try {
      const redirectTo = `${window.location.origin}/Verified`;
      const { data, error } = await supabase.auth.signUp({
        email: String(email || '').trim().slice(0, 254),
        password: String(password || '').slice(0, 128),
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: String(fullName || '').trim().slice(0, 120),
            phone: String(phone || '').trim().slice(0, 40)
          }
        }
      });
      if (error) throw error;
      setMessage('Check your email to verify your account.');
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured');
    const cooldown = assertClientCooldown('auth-signin', 8_000);
    if (!cooldown.ok) throw new Error(cooldown.error);
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || '').trim().slice(0, 254),
        password: String(password || '').slice(0, 128)
      });
      if (error) throw error;
      await loadProfile(data.user.id);
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } finally {
      setBusy(false);
    }
  }

  const value = useMemo(() => ({
    ready,
    busy,
    message,
    setMessage,
    session,
    user,
    profile,
    isAdmin,
    isCustomer,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => (user ? loadProfile(user.id) : Promise.resolve(null))
  }), [ready, busy, message, session, user, profile, isAdmin, isCustomer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
