import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { href } from '../lib/router';
import { formatClock, formatDate, formatDuration } from '../lib/time';
import CrowdMeter from '../components/CrowdMeter';
import LoginPrompt from '../components/LoginPrompt';

function Totals({ journeys }) {
  const fare = journeys.reduce((sum, trip) => sum + (trip.fare || 0), 0);
  const minutes = journeys.reduce((sum, trip) => sum + (trip.duration || 0), 0);
  const trips = journeys.length === 1 ? '1 trip' : `${journeys.length} trips`;
  return (
    <p className="history-total">
      {trips}, ₹{fare} in fares and {formatDuration(minutes)} on the metro.
    </p>
  );
}

export default function History() {
  const { user, showToast } = useApp();
  const [journeys, setJourneys] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setJourneys(null);
    if (!user) return;
    api('/journeys').then(setJourneys).catch((err) => setError(err.message));
  }, [user]);

  async function remove(trip) {
    try {
      await api(`/journeys/${trip._id}`, { method: 'DELETE' });
      setJourneys((current) => current.filter((item) => item._id !== trip._id));
      showToast('Trip removed');
    } catch (err) {
      showToast(err.message);
    }
  }

  let content;
  if (!user) {
    content = <LoginPrompt message="Log in to keep a log of your trips." />;
  } else if (error) {
    content = <p className="form-error" role="alert">{error}</p>;
  } else if (!journeys) {
    content = <p className="muted">Loading your trips</p>;
  } else if (journeys.length === 0) {
    content = (
      <div className="empty">
        <p>You have not logged a trip yet. Plan a trip, then select Log this trip.</p>
        <div className="empty__actions"><a className="button" href={href('planner')}>Plan a trip</a></div>
      </div>
    );
  } else {
    content = (
      <>
        <Totals journeys={journeys} />
        <table className="table table--stack">
          <thead>
            <tr><th>Date</th><th>Left at</th><th>From</th><th>To</th><th className="num">Stops</th><th className="num">Time</th><th className="num">Fare</th><th>Crowd</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {journeys.map((trip) => (
              <tr key={trip._id}>
                <td className="table__lead" data-label="Date">{formatDate(trip.departureTime)}</td>
                <td data-label="Left at">{formatClock(new Date(trip.departureTime))}</td>
                <td data-label="From">{trip.fromStation}</td>
                <td data-label="To">{trip.toStation}</td>
                <td className="num" data-label="Stops">{trip.stops}</td>
                <td className="num" data-label="Time">{formatDuration(trip.duration)}</td>
                <td className="num" data-label="Fare">₹{trip.fare}</td>
                <td data-label="Crowd"><CrowdMeter level={trip.crowdLevel} /></td>
                <td className="table__actions">
                  <button type="button" className="link-button link-button--danger" onClick={() => remove(trip)}>
                    Remove<span className="visually-hidden"> trip from {trip.fromStation} to {trip.toStation}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <>
      <div className="page-head"><h1>Trip history</h1></div>
      {content}
    </>
  );
}
