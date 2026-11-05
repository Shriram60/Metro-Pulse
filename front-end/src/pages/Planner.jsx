import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { crowdLevel } from '../lib/crowd';
import { atTime, formatClock, formatDuration, formatHhmm, isLineOpen, toTimeInput } from '../lib/time';
import CrowdMeter from '../components/CrowdMeter';
import RouteStrip from '../components/RouteStrip';
import StationSelect from '../components/StationSelect';

const MINUTE = 60 * 1000;

// Each leg, with the time the rider reaches it and whether its line is running then.
function checkLegs(route, lines, departure) {
  return route.legs.map((leg) => {
    const boarding = new Date(departure.getTime() + leg.stations[0].minute * MINUTE);
    const line = lines.find((item) => item.id === leg.line);
    return { line, boarding, open: isLineOpen(line, boarding) };
  });
}

function ServiceNotice({ legs, departure }) {
  const blocked = legs.filter((leg) => !leg.open);
  if (blocked.length === 0) {
    return <p className="service service--open">Every line on this trip is running when you reach it.</p>;
  }
  return (
    <div className="service service--closed" role="alert">
      <p>This trip does not work leaving at {formatClock(departure)}.</p>
      <ul>
        {blocked.map(({ line, boarding }) => (
          <li key={line.id}>
            The {line.name} runs from {formatHhmm(line.firstTrain)} to {formatHhmm(line.lastTrain)}, and you
            would reach it at {formatClock(boarding)}.
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Planner({ params }) {
  const { stations, lines, user, openAuth, showToast } = useApp();

  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState(params.get('to') || '');
  const [time, setTime] = useState(params.get('at') || toTimeInput(new Date()));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logged, setLogged] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    if (user?.homeStation) setFrom((current) => current || user.homeStation);
  }, [user]);

  const plan = useCallback(async (fromId, toId, at) => {
    latestRequest.current += 1;
    const request = latestRequest.current;
    setBusy(true);
    setError('');
    setSaved(false);
    setLogged(false);
    try {
      const route = await api(`/routes/plan?from=${fromId}&to=${toId}`);
      if (request !== latestRequest.current) return;
      setResult({ route, departure: atTime(at) });
    } catch (err) {
      if (request !== latestRequest.current) return;
      setResult(null);
      setError(err.message);
    } finally {
      if (request === latestRequest.current) setBusy(false);
    }
  }, []);

  // The route on screen always matches the form, so an old one cannot be saved by mistake.
  function clearRoute() {
    latestRequest.current += 1;
    setResult(null);
    setError('');
    setBusy(false);
  }

  function changeFrom(value) {
    setFrom(value);
    clearRoute();
  }

  function changeTo(value) {
    setTo(value);
    clearRoute();
  }

  useEffect(() => {
    if (params.get('from') && params.get('to')) {
      plan(params.get('from'), params.get('to'), params.get('at') || toTimeInput(new Date()));
    }
  }, [params, plan]);

  function submit(event) {
    event.preventDefault();
    plan(from, to, time);
  }

  function swap() {
    setFrom(to);
    setTo(from);
    clearRoute();
  }

  const stationById = (id) => stations.find((station) => station.stationId === id);

  async function saveFavorite() {
    if (!user) return openAuth('login');
    const { route } = result;
    try {
      await api('/favorites', {
        method: 'POST',
        body: { from: route.from.stationId, to: route.to.stationId, label: `${route.from.name} to ${route.to.name}` },
      });
      setSaved(true);
      showToast('Saved to favorites');
    } catch (err) {
      if (err.status === 409) setSaved(true);
      showToast(err.message);
    }
    return undefined;
  }

  async function logTrip(averageCrowd) {
    if (!user) return openAuth('login');
    const { route, departure } = result;
    try {
      await api('/journeys', {
        method: 'POST',
        body: {
          from: route.from.stationId,
          to: route.to.stationId,
          departureTime: departure.toISOString(),
          crowdLevel: averageCrowd,
        },
      });
      setLogged(true);
      showToast('Trip added to your history');
    } catch (err) {
      showToast(err.message);
    }
    return undefined;
  }

  let details = (
    <div className="empty empty--plain">
      <p>{from && to ? 'Select Find route to see this trip.' : 'Choose two stations to see the route, the fare and how busy it will be.'}</p>
    </div>
  );

  if (result) {
    const { route, departure } = result;
    const legs = checkLegs(route, lines, departure);
    const possible = legs.every((leg) => leg.open);
    const fromCrowd = crowdLevel(stationById(route.from.stationId), departure);
    const toCrowd = crowdLevel(stationById(route.to.stationId), departure);
    const averageCrowd = Math.round((fromCrowd + toCrowd) / 2);

    details = (
      <section aria-label="Your route">
        <h2 className="route-title">{route.from.name} to {route.to.name}</h2>
        <ServiceNotice legs={legs} departure={departure} />

        <dl className="route-facts">
          <div className="route-facts__fare"><dt>Fare</dt><dd>₹{route.fare}</dd></div>
          <div><dt>Travel time</dt><dd>{formatDuration(route.minutes)}</dd></div>
          <div><dt>Stops</dt><dd>{route.stops}</dd></div>
          <div><dt>Changes</dt><dd>{route.interchanges}</dd></div>
          {possible && <div><dt>Average crowd</dt><dd><CrowdMeter level={averageCrowd} /></dd></div>}
        </dl>

        <div className="route-actions">
          <button type="button" className="button" onClick={saveFavorite} disabled={saved}>
            {saved ? 'In your favorites' : 'Save to favorites'}
          </button>
          <button
            type="button"
            className="button button--plain"
            onClick={() => logTrip(averageCrowd)}
            disabled={logged || !possible}
          >
            {logged ? 'Trip logged' : 'Log this trip'}
          </button>
        </div>

        <RouteStrip route={route} departure={departure} showCrowd={possible} />
      </section>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Plan a trip</h1>
      </div>

      <div className="planner">
        <form className="panel planner__form" onSubmit={submit}>
          <StationSelect label="From" value={from} onChange={changeFrom} lines={lines} stations={stations} emptyLabel="Choose a station" required />
          <button type="button" className="link-button planner__swap" onClick={swap}>Swap stations</button>
          <StationSelect label="To" value={to} onChange={changeTo} lines={lines} stations={stations} emptyLabel="Choose a station" required />
          <label className="field">
            <span>Leaving at</span>
            <input
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                clearRoute();
              }}
              required
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button--wide" disabled={busy}>Find route</button>
        </form>

        <div className="planner__result">{details}</div>
      </div>
    </>
  );
}
