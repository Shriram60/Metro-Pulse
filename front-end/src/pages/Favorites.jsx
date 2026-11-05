import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { href } from '../lib/router';
import LineMark from '../components/LineMark';
import LoginPrompt from '../components/LoginPrompt';

export default function Favorites() {
  const { user, showToast } = useApp();
  const [favorites, setFavorites] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setFavorites(null);
    if (!user) return;
    api('/favorites').then(setFavorites).catch((err) => setError(err.message));
  }, [user]);

  async function remove(route) {
    try {
      await api(`/favorites/${route._id}`, { method: 'DELETE' });
      setFavorites((current) => current.filter((item) => item._id !== route._id));
      showToast('Removed from favorites');
    } catch (err) {
      showToast(err.message);
    }
  }

  let content;
  if (!user) {
    content = <LoginPrompt message="Log in to see the routes you have saved." />;
  } else if (error) {
    content = <p className="form-error" role="alert">{error}</p>;
  } else if (!favorites) {
    content = <p className="muted">Loading your favorites</p>;
  } else if (favorites.length === 0) {
    content = (
      <div className="empty">
        <p>You have no favorites yet. Plan a trip, then select Save to favorites.</p>
        <div className="empty__actions"><a className="button" href={href('planner')}>Plan a trip</a></div>
      </div>
    );
  } else {
    content = (
      <table className="table table--stack">
        <thead>
          <tr><th>Route</th><th>From</th><th>To</th><th className="num">Stops</th><th className="num">Fare</th><th><span className="visually-hidden">Actions</span></th></tr>
        </thead>
        <tbody>
          {favorites.map((route) => (
            <tr key={route._id}>
              <td className="table__lead" data-label="Route">{route.label}</td>
              <td data-label="From"><LineMark line={route.fromLine} /> {route.fromStation}</td>
              <td data-label="To"><LineMark line={route.toLine} /> {route.toStation}</td>
              <td className="num" data-label="Stops">{route.stops}</td>
              <td className="num" data-label="Fare">₹{route.fare}</td>
              <td className="table__actions">
                <a href={href('planner', { from: route.fromStationId, to: route.toStationId })}>Plan</a>
                <button type="button" className="link-button link-button--danger" onClick={() => remove(route)}>
                  Remove<span className="visually-hidden"> {route.label}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className="page-head"><h1>Favorites</h1></div>
      {content}
    </>
  );
}
