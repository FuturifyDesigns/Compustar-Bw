import React, { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const whatsappPhone = '26776004665';

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function passwordStrength(password) {
  if (!password) return { score: 0, label: '', tone: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const clamped = Math.min(score, 4);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const tones = ['weak', 'fair', 'good', 'strong'];
  return {
    score: clamped,
    percent: (clamped / 4) * 100,
    label: labels[clamped - 1] || 'Weak',
    tone: tones[clamped - 1] || 'weak'
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
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
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    try {
      const notice = sessionStorage.getItem('compustar-auth-notice');
      if (notice) {
        setAuthNotice(notice);
        sessionStorage.removeItem('compustar-auth-notice');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const next = sessionStorage.getItem('compustar-auth-next');
      if (next) {
        sessionStorage.removeItem('compustar-auth-next');
        go(next);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const fieldErrors = useMemo(() => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(form.email.trim())) next.email = 'Enter a valid email address.';

    if (!form.password) next.password = 'Password is required.';
    else if (mode === 'signup' && form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    else if (mode === 'signup' && strength.score < 2) next.password = 'Choose a stronger password.';

    if (mode === 'signup') {
      if (!form.fullName.trim()) next.fullName = 'Full name is required.';
      if (!form.phone.trim()) next.phone = 'Phone number is required.';
      else if (!isValidPhone(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    }
    return next;
  }, [form, mode, strength.score]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLocalMessage('');
    setTouched({
      email: true,
      password: true,
      ...(mode === 'signup' ? { fullName: true, phone: true } : {})
    });
    if (Object.keys(fieldErrors).length) {
      setError('Please fix the highlighted fields.');
      return;
    }
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
        setForm((prev) => ({ ...prev, password: '' }));
        setTouched({});
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  }

  if (!ready) return <section className="section account-section"><p>Loading account…</p></section>;

  if (user) {
    return (
      <section className="section account-section">
        <div className="account-card account-card--compact" data-reveal>
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
      <div className="account-card account-card--compact" data-reveal>
        <p className="kicker">Customer access</p>
        <h1>{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
        <p className="account-lead">
          {authNotice
            || (mode === 'login'
              ? 'Sign in to manage your order requests with Compustar.'
              : 'Create an account to submit order requests. We’ll email a verification link.')}
        </p>
        <div className="account-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setTouched({}); }}>Sign in</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setTouched({}); }}>Sign up</button>
        </div>
        <form className={`account-form${mode === 'signup' ? ' is-signup' : ''}`} onSubmit={onSubmit} noValidate>
          {mode === 'signup' && (
            <div className="account-form-row">
              <label className={touched.fullName && fieldErrors.fullName ? 'has-error' : ''}>
                <span className="label-text">Full name <span className="req">*</span></span>
                <input
                  value={form.fullName}
                  onChange={update('fullName')}
                  onBlur={() => markTouched('fullName')}
                  required
                  autoComplete="name"
                  aria-invalid={Boolean(touched.fullName && fieldErrors.fullName)}
                />
                {touched.fullName && fieldErrors.fullName ? <span className="field-error">{fieldErrors.fullName}</span> : null}
              </label>
              <label className={touched.phone && fieldErrors.phone ? 'has-error' : ''}>
                <span className="label-text">Phone <span className="req">*</span></span>
                <input
                  value={form.phone}
                  onChange={update('phone')}
                  onBlur={() => markTouched('phone')}
                  placeholder="+267…"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(touched.phone && fieldErrors.phone)}
                />
                {touched.phone && fieldErrors.phone ? <span className="field-error">{fieldErrors.phone}</span> : null}
              </label>
            </div>
          )}
          <label className={touched.email && fieldErrors.email ? 'has-error' : ''}>
            <span className="label-text">Email <span className="req">*</span></span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              onBlur={() => markTouched('email')}
              required
              autoComplete="email"
              aria-invalid={Boolean(touched.email && fieldErrors.email)}
            />
            {touched.email && fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
          </label>
          <label className={touched.password && fieldErrors.password ? 'has-error' : ''}>
            <span className="label-text">Password <span className="req">*</span></span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              onBlur={() => markTouched('password')}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(touched.password && fieldErrors.password)}
            />
            {form.password ? (
              <div className={`password-meter tone-${strength.tone}`} aria-live="polite">
                <div className="password-meter-track">
                  <span style={{ width: `${strength.percent}%` }} />
                </div>
                <small>{strength.label}</small>
              </div>
            ) : null}
            {touched.password && fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>
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
      <div className="account-card account-card--compact verified-card" data-reveal>
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
          <button type="button" className="button dark" onClick={() => go('/Account')}>
            {user ? 'Go to account' : 'Sign in'}
          </button>
          <button type="button" className="button secondary-dark" onClick={() => go('/Products')}>Browse products</button>
        </div>
        <a className="account-whatsapp" href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">Need help? WhatsApp Compustar</a>
      </div>
    </section>
  );
}
