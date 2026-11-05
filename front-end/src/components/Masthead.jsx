import { useApp } from '../context';
import { formatClock, useNow } from '../lib/time';
import { href } from '../lib/router';

const NAV = [
  ['home', 'Home'],
  ['planner', 'Planner'],
  ['stations', 'Stations'],
  ['favorites', 'Favorites'],
  ['history', 'History'],
  ['stats', 'Stats'],
  ['map', 'Map'],
];

function Clock() {
  const now = useNow(1000);
  return <time className="masthead__clock">{formatClock(now)}</time>;
}

export default function Masthead({ activePage }) {
  const { user, restoring, openAuth } = useApp();

  return (
    <header className="masthead">
      <div className="wrap masthead__top">
        <a className="brand" href={href('home')}>
          <img className="brand__mark" src="/favicon.svg" alt="" width="32" height="32" />
          <span className="brand__name">MetroPulse</span>
          <span className="brand__kannada" lang="kn">ಮೆಟ್ರೋ ಪಲ್ಸ್</span>
        </a>
        <div className="masthead__side">
          <Clock />
          {user && <a className="masthead__account" href={href('profile')}>{user.username}</a>}
          {!user && !restoring && (
            <button type="button" className="button button--on-navy" onClick={() => openAuth('login')}>
              Log in
            </button>
          )}
        </div>
      </div>
      <nav className="wrap masthead__nav" aria-label="Main">
        {NAV.map(([page, label]) => (
          <a key={page} href={href(page)} aria-current={activePage === page ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
