import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const whatsappPhone = '26776004665';

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function AccountPage() {
  const { user, profile, busy, message, signIn, signUp, signOut, ready } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [localMessage, setLocalMessage] = useState('');

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLocalMessage('');
    try {
      if (mode === 'login') {
        await signIn(form.email.trim(), form.password);
        setLocalMessage('Signed in.');
      } else {
        await signUp({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone.trim()
        });
        setLocalMessage('Account created. Check your email to verify, then sign in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  }

  if (!ready) return <section className="section account-section"><p>Loading account…</p></section>;

  if (user) {
    return (
      <section className="section account-section">
        <div className="account-card" data-reveal>
          <p className="kicker">My account</p>
          <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}.</h1>
          <p className="account-lead">Signed in as {user.email}</p>
          <div className="account-actions">
            <button type="button" className="button dark" onClick={() => go('/Cart')}>View cart</button>
            <button type="button" className="button secondary-dark" onClick={() => go('/Checkout')}>Request an order</button>
            <button type="button" className="button ghost-dark" onClick={() => signOut()}>Sign out</button>
          </div>
          {(message || localMessage) && <p className="account-note">{localMessage || message}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="section account-section">
      <div className="account-card" data-reveal>
        <p className="kicker">Customer access</p>
        <h1>{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
        <p className="account-lead">
          Sign up to save order requests. After signup, verify your email on the verification page linked from Brevo/Supabase.
        </p>
        <div className="account-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <form className="account-form" onSubmit={onSubmit}>
          {mode === 'signup' && (
            <>
              <label>Full name<input value={form.fullName} onChange={update('fullName')} required /></label>
              <label>Phone<input value={form.phone} onChange={update('phone')} placeholder="+267…" /></label>
            </>
          )}
          <label>Email<input type="email" value={form.email} onChange={update('email')} required autoComplete="email" /></label>
          <label>Password<input type="password" value={form.password} onChange={update('password')} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <p className="cms-error">{error}</p>}
          {(message || localMessage) && <p className="account-note">{localMessage || message}</p>}
          <button className="button dark" type="submit" disabled={busy || !supabaseConfigured}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </section>
  );
}

export function VerifiedPage() {
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        if (alive) setStatus('ready');
        return;
      }
      // Handle email confirmation links that land with tokens in the URL hash/query
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && alive) setStatus('error');
      }
      await supabase.auth.getSession();
      await refreshProfile?.();
      if (alive) setStatus('ready');
    })().catch(() => alive && setStatus('error'));
    return () => { alive = false; };
  }, [refreshProfile]);

  return (
    <section className="section account-section">
      <div className="account-card verified-card" data-reveal>
        <p className="kicker">Email verification</p>
        <h1>{status === 'error' ? 'Verification issue' : 'You are verified.'}</h1>
        <p className="account-lead">
          {status === 'checking'
            ? 'Confirming your email…'
            : status === 'error'
              ? 'We could not finish verification automatically. Sign in and try the email link again.'
              : 'Your Compustar account email is confirmed. You can sign in and submit order requests.'}
        </p>
        <div className="account-actions">
          <button type="button" className="button dark" onClick={() => go(user ? '/Account' : '/Account')}>
            {user ? 'Go to account' : 'Sign in'}
          </button>
          <button type="button" className="button secondary-dark" onClick={() => go('/Products')}>Browse products</button>
        </div>
        <a className="account-whatsapp" href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">Need help? WhatsApp Compustar</a>
      </div>
    </section>
  );
}
