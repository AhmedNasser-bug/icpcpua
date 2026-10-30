import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../../../shared/services/api.js";
import { normalizeUsername, isValidUsername } from '../utils/username.js';
function StudentIdField({
  id,
  label,
  value,
  onChange
}) {
  return <div className="student-id-entry">
      <label htmlFor={id}>{label}<input id={id} autoComplete="off" inputMode="numeric" pattern="[0-9]{4,20}" title="Enter 4–20 digits." required maxLength="20" value={value} onChange={onChange} /></label>
    </div>;
}
export function AuthPage({
  session
}) {
  const location = useLocation();
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [googleButtonError, setGoogleButtonError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const authRequestInFlight = useRef(false);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const from = '/';

  const acceptAuthentication = result => {
    session.acceptSession(result);
    if (!result.user?.username) {
      navigate('/onboarding/username', {
        replace: true,
        state: { from }
      });
      return;
    }
    navigate(from, { replace: true });
  };

  const googleCredentialHandler = useRef(null);
  googleCredentialHandler.current = async response => {
    if (busy || authRequestInFlight.current) return;
    if (!response?.credential) {
      setError('Google sign-in did not return an ID token. Please try again.');
      return;
    }
    authRequestInFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential })
      });
      acceptAuthentication(result);
    } catch (reason) {
      setError(reason.message);
    } finally {
      authRequestInFlight.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined;
    let active = true;
    let initialized = false;
    let resizeObserver;
    let script;

    const renderGoogleButton = () => {
      const googleIdentity = window.google?.accounts?.id;
      const container = googleButtonRef.current;
      if (!active || initialized || !googleIdentity || !container) return;
      const width = Math.min(Math.floor(container.getBoundingClientRect().width), 400);
      if (width < 1) return;
      try {
        googleIdentity.initialize({
          client_id: googleClientId,
          callback: response => googleCredentialHandler.current?.(response),
        });
        googleIdentity.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width,
        });
        initialized = true;
        setGoogleButtonError('');
      } catch {
        setGoogleButtonError('Google sign-in could not be initialized. Please check the configured client ID.');
      }
    };

    const source = 'https://accounts.google.com/gsi/client';
    const handleScriptLoad = () => {
      if (!active) return;
      if (!window.google?.accounts?.id) {
        setGoogleButtonError('Google Identity Services loaded without its sign-in API. Please try again.');
        return;
      }
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(renderGoogleButton);
        resizeObserver.observe(googleButtonRef.current);
      }
      renderGoogleButton();
    };
    const handleScriptError = () => {
      if (active) setGoogleButtonError('Google sign-in could not load. Check your connection and try again.');
    };

    if (window.google?.accounts?.id) {
      handleScriptLoad();
    } else {
      script = document.querySelector(`script[src="${source}"]`);
      const isNewScript = !script;
      if (!script) {
        script = document.createElement('script');
        script.src = source;
        script.async = true;
        script.defer = true;
      }
      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError, { once: true });
      if (isNewScript) document.head.appendChild(script);
    }

    return () => {
      active = false;
      resizeObserver?.disconnect();
      script?.removeEventListener('load', handleScriptLoad);
      script?.removeEventListener('error', handleScriptError);
    };
  }, [googleClientId]);

  useEffect(() => {
    setMode(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');
    setError('');
  }, [location.search]);
  const submit = async event => {
    event.preventDefault();
    if (authRequestInFlight.current) return;
    setBusy(true);
    setError('');
    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        setBusy(false);
        return;
      }
      const username = normalizeUsername(form.username);
      if (!isValidUsername(username)) {
        setError('Username must be 3–20 characters using letters, numbers, and underscores.');
        setBusy(false);
        return;
      }
      setForm(current => ({
        ...current,
        username
      }));
    }
    authRequestInFlight.current = true;
    try {
      const payload = mode === 'register' ? {
        name: form.name,
        email: form.email,
        username: normalizeUsername(form.username),
        password: form.password
      } : {
        email: form.email,
        password: form.password
      };
      const result = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      acceptAuthentication(result);
    } catch (reason) {
      setError(reason.message);
    } finally {
      authRequestInFlight.current = false;
      setBusy(false);
    }
  };
  if (session.user) return <Navigate to={session.user.username ? '/' : '/onboarding/username'} replace />;
  return <main className="auth-layout">
      <div className="auth-art"><h1>Your next<br />breakthrough<br /><span>starts here</span></h1><div className="auth-symbol">{'{ }'}</div></div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN OUR FAMILY'}</span>
        <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
        {googleClientId ? <>
          <div className="google-signin-button" ref={googleButtonRef} />
          {googleButtonError && <div className="notice error-notice" role="alert">{googleButtonError}</div>}
          <div className="auth-divider"><span>or continue with email</span></div>
        </> : <div className="notice error-notice" role="status">Google sign-in is unavailable. Configure VITE_GOOGLE_CLIENT_ID for this frontend deployment.</div>}
        {mode === 'register' && <label>Your name<input autoComplete="name" required maxLength="80" value={form.name} onChange={e => setForm({
          ...form,
          name: e.target.value
        })} /></label>}
        <label>{mode === 'register' ? 'email' : 'Email address'}<input autoComplete="email" type="email" required value={form.email} onChange={e => setForm({
          ...form,
          email: e.target.value
        })} /></label>
        {mode === 'register' && <label>Username<input autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={form.username} onChange={e => setForm({
          ...form,
          username: e.target.value
        })} /></label>}
        <label>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" minLength="8" required value={form.password} onChange={e => setForm({
          ...form,
          password: e.target.value
        })} /></label>
        {mode === 'register' && <label>Confirm password<input autoComplete="new-password" type="password" minLength="8" required value={form.confirmPassword || ''} onChange={e => setForm({
          ...form,
          confirmPassword: e.target.value
        })} /></label>}
        {error && <div className="notice error-notice">{error}</div>}
        <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment...' : mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={17} /></button>
        <p className="auth-switch">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button type="button" onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}> {mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
      </form>
    </main>;
}
export function UsernameSetupPage({
  session
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(session.user?.username || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const from = '/';
  if (!session.user) return <Navigate to="/login" replace />;
  if (session.user.username) return <Navigate to={from} replace />;
  const submit = async event => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError('Username must be 3–20 characters using letters, numbers, and underscores.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/username', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          username: normalized
        })
      });
      session.updateUser(result.user);
      navigate(from, {
        replace: true
      });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  return <main className="page-wrap">
      <div className="page-heading"><span className="eyebrow">WELCOME</span><h1>Choose your <span>username.</span></h1><p>Pick a username to continue using the ICPC Community. It must be 3–20 characters using only letters, numbers, and underscores.</p></div>
      <section className="settings-card" aria-labelledby="username-onboarding-title">
        <h2 id="username-onboarding-title">Username required</h2>
        <p>Your account is ready, but your username is required before you can continue. This helps keep member profiles consistent and prevents duplicates.</p>
        <form onSubmit={submit} className="student-id-form">
          <label htmlFor="onboarding-username">Username<input id="onboarding-username" autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={event => setUsername(event.target.value)} /></label>
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save username'} <ArrowRight size={16} /></button>
        </form>
      </section>
    </main>;
}
export function RequireUsername({
  session,
  children
}) {
  const location = useLocation();
  if (session.loading) {
    return <div className="empty-state"><span className="loader" /> Loading your account...</div>;
  }
  if (!session.user) {
    return <Navigate to="/login" replace state={{
      from: location.pathname + location.search
    }} />;
  }
  if (!session.user.username && location.pathname !== '/onboarding/username') {
    return <Navigate to="/onboarding/username" replace state={{
      from: location.pathname + location.search
    }} />;
  }
  return children;
}
