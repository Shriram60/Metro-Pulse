import { useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { formatLongDate } from '../lib/time';
import LoginPrompt from '../components/LoginPrompt';
import StationSelect from '../components/StationSelect';

// Only rendered once the user is known, so the fields are right from the first
// paint and an early edit cannot overwrite them with blanks.
function ProfileForm({ user }) {
  const { setUser, signOut, stations, lines, showToast } = useApp();
  const [form, setForm] = useState({
    username: user.username,
    phone: user.phone || '',
    homeStation: user.homeStation || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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
          <input
            value={form.username}
            onChange={(event) => setField('username', event.target.value)}
            minLength={3}
            maxLength={30}
            required
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={user.email} readOnly />
          <small>Your email cannot be changed.</small>
        </label>
        <label className="field">
          <span>Phone</span>
          <input type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
        </label>
        <StationSelect
          label="Home station"
          value={form.homeStation}
          onChange={(homeStation) => setField('homeStation', homeStation)}
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

export default function Profile() {
  const { user } = useApp();

  if (!user) {
    return (
      <>
        <div className="page-head"><h1>Profile</h1></div>
        <LoginPrompt message="Log in to manage your account." />
      </>
    );
  }

  return <ProfileForm key={user._id} user={user} />;
}
