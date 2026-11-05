import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { formatLongDate } from '../lib/time';
import LoginPrompt from '../components/LoginPrompt';
import StationSelect from '../components/StationSelect';

export default function Profile() {
  const { user, setUser, signOut, stations, lines, showToast } = useApp();
  const [form, setForm] = useState({ username: '', phone: '', homeStation: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, phone: user.phone || '', homeStation: user.homeStation || '' });
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <div className="page-head"><h1>Profile</h1></div>
        <LoginPrompt message="Log in to manage your account." />
      </>
    );
  }

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setUser(await api('/auth/me', { method: 'PATCH', body: form }));
      showToast('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Profile</h1>
        <p>Member since {formatLongDate(user.createdAt)}</p>
      </div>

      <form className="panel profile" onSubmit={save}>
        <label className="field">
          <span>Username</span>
          <input value={form.username} onChange={update('username')} minLength={3} maxLength={30} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={user.email} readOnly />
          <small>Your email cannot be changed.</small>
        </label>
        <label className="field">
          <span>Phone</span>
          <input type="tel" value={form.phone} onChange={update('phone')} />
        </label>
        <StationSelect
          label="Home station"
          value={form.homeStation}
          onChange={(homeStation) => setForm({ ...form, homeStation })}
          lines={lines}
          stations={stations}
          emptyLabel="No home station"
          hint="The planner starts from this station."
        />

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="profile__actions">
          <button type="submit" className="button" disabled={busy}>Save profile</button>
          <button type="button" className="button button--plain" onClick={signOut}>Log out</button>
        </div>
      </form>
    </>
  );
}
