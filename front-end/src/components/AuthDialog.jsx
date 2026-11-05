import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';

const EMPTY_FORM = { username: '', email: '', password: '', phone: '' };

export default function AuthDialog({ mode, onModeChange }) {
  const { signIn, showToast } = useApp();
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (mode && !dialog.open) dialog.showModal();
    if (!mode && dialog.open) dialog.close();
    if (!mode) setForm(EMPTY_FORM);
    setError('');
  }, [mode]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = isRegister
        ? await api('/auth/register', { method: 'POST', body: form })
        : await api('/auth/login', { method: 'POST', body: { email: form.email, password: form.password } });
      signIn(session);
      setForm(EMPTY_FORM);
      onModeChange(null);
      showToast(`Logged in as ${session.user.username}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="dialog" onClose={() => onModeChange(null)} aria-labelledby="auth-title">
      <form onSubmit={submit}>
        <h2 id="auth-title">{isRegister ? 'Create an account' : 'Log in'}</h2>
        <p className="dialog__hint">
          {isRegister
            ? 'An account lets you save favorite routes and keep a log of your trips.'
            : 'Log in to see your favorite routes and trip history.'}
        </p>

        {isRegister && (
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={update('username')} autoComplete="username" minLength={3} maxLength={30} required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
          {isRegister && <small>At least 8 characters</small>}
        </label>
        {isRegister && (
          <label className="field">
            <span>Phone (optional)</span>
            <input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" />
          </label>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="dialog__actions">
          <button type="submit" className="button" disabled={busy}>
            {isRegister ? 'Create account' : 'Log in'}
          </button>
          <button type="button" className="button button--plain" onClick={() => onModeChange(null)}>
            Cancel
          </button>
        </div>
      </form>

      <p className="dialog__switch">
        {isRegister ? 'Already have an account?' : 'New to MetroPulse?'}{' '}
        <button type="button" className="link-button" onClick={() => onModeChange(isRegister ? 'login' : 'register')}>
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </dialog>
  );
}
