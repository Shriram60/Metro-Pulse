import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, clearToken, getToken, setSessionExpiredHandler, setToken } from './api';
import { AppContext } from './context';
import { useRoute } from './lib/router';
import AuthDialog from './components/AuthDialog';
import Masthead from './components/Masthead';
import Toast from './components/Toast';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Planner from './pages/Planner';
import Profile from './pages/Profile';
import Stations from './pages/Stations';
import Stats from './pages/Stats';

const PAGES = {
  home: { title: 'Bangalore metro right now', component: Home },
  planner: { title: 'Planner', component: Planner },
  stations: { title: 'Stations', component: Stations },
  favorites: { title: 'Favorites', component: Favorites },
  history: { title: 'History', component: History },
  stats: { title: 'Stats', component: Stats },
  map: { title: 'Map', component: MapPage },
  profile: { title: 'Profile', component: Profile },
};

export default function App() {
  const route = useRoute();
  const [network, setNetwork] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(() => Boolean(getToken()));
  const [authMode, setAuthMode] = useState(null);
  const [toast, setToast] = useState(null);
  const mainRef = useRef(null);

  const loadNetwork = useCallback(async () => {
    setLoadError('');
    try {
      const [stations, lines] = await Promise.all([api('/stations'), api('/lines')]);
      setNetwork({ stations, lines });
    } catch (error) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setToast({ message: 'Your session has expired. Log in again.', id: Date.now() });
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  const page = PAGES[route.page];

  useEffect(() => {
    document.title = route.page === 'home' || !page ? 'MetroPulse' : `${page.title} | MetroPulse`;
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  }, [route.key, route.page, page]);

  const context = useMemo(() => ({
    ...network,
    user,
    restoring,
    setUser,
    openAuth: setAuthMode,
    showToast: (message) => setToast({ message, id: Date.now() }),
    signIn: ({ token, user: signedIn }) => {
      setToken(token);
      setUser(signedIn);
    },
    signOut: () => {
      clearToken();
      setUser(null);
      window.location.hash = '#/';
    },
  }), [network, user, restoring]);

  let content;
  if (loadError) {
    content = (
      <div className="message-page" role="alert">
        <h1>The network could not be loaded</h1>
        <p>{loadError}</p>
        <button type="button" className="button" onClick={loadNetwork}>Try again</button>
      </div>
    );
  } else if (!network) {
    content = <div className="message-page"><p>Loading stations</p></div>;
  } else if (!page) {
    content = (
      <div className="message-page">
        <h1>This page does not exist</h1>
        <a className="button" href="#/">Go to the home page</a>
      </div>
    );
  } else {
    const Page = page.component;
    content = <Page key={route.key} params={route.params} />;
  }

  return (
    <AppContext.Provider value={context}>
      <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); mainRef.current?.focus(); }}>
        Skip to content
      </a>
      <Masthead activePage={route.page} />
      <main id="main" ref={mainRef} tabIndex={-1} className="wrap">
        {content}
      </main>
      <footer className="wrap footer">
        <p>
          Crowd levels are simulated, and fares and travel times are estimates. Not affiliated with BMRCL.
        </p>
      </footer>
      <AuthDialog mode={authMode} onModeChange={setAuthMode} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </AppContext.Provider>
  );
}
