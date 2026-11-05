import { useApp } from '../context';

export default function LoginPrompt({ message }) {
  const { openAuth, restoring } = useApp();

  if (restoring) return <p className="muted">Loading your account</p>;

  return (
    <div className="empty">
      <p>{message}</p>
      <div className="empty__actions">
        <button type="button" className="button" onClick={() => openAuth('login')}>Log in</button>
        <button type="button" className="button button--plain" onClick={() => openAuth('register')}>Create an account</button>
      </div>
    </div>
  );
}
