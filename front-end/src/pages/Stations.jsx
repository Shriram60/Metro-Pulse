import { useState } from 'react';
import { useApp } from '../context';
import { crowdLevel } from '../lib/crowd';
import { TYPE_LABELS, stationsOnLine } from '../lib/network';
import { href } from '../lib/router';
import { formatHhmm, isLineOpen, useNow } from '../lib/time';
import CrowdMeter from '../components/CrowdMeter';

function StationRow({ station, open, now, linked }) {
  return (
    <li className={`station-row station-row--${station.line}${linked ? '' : ' station-row--unlinked'}`}>
      <span className="station-row__stop" aria-hidden="true" />
      <span className="station-row__text">
        <a href={href('planner', { from: station.stationId })}>{station.name}</a>
        {TYPE_LABELS[station.type] && <small>{TYPE_LABELS[station.type]}</small>}
      </span>
      {!station.operational && <span className="muted">Not in service</span>}
      {station.operational && open && <CrowdMeter level={crowdLevel(station, now)} />}
      {station.operational && !open && <span className="muted">Closed</span>}
    </li>
  );
}

export default function Stations() {
  const { stations, lines } = useApp();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState('all');

  const search = query.trim().toLowerCase();
  const visibleLines = lines.filter((line) => lineFilter === 'all' || line.id === lineFilter);

  const sections = visibleLines
    .map((line) => ({
      line,
      stations: stationsOnLine(stations, line.id).filter((station) => station.name.toLowerCase().includes(search)),
    }))
    .filter((section) => section.stations.length > 0);

  return (
    <>
      <div className="page-head">
        <h1>Stations</h1>
        <p>Select a station to plan a trip from it.</p>
      </div>

      <div className="station-tools">
        <label className="field station-tools__search">
          <span>Search stations</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Majestic or Electronic City"
          />
        </label>
        <fieldset className="segmented">
          <legend>Line</legend>
          {[{ id: 'all', name: 'All lines' }, ...lines].map((line) => (
            <label key={line.id} className={lineFilter === line.id ? 'is-selected' : undefined}>
              <input
                type="radio"
                name="line"
                value={line.id}
                checked={lineFilter === line.id}
                onChange={() => setLineFilter(line.id)}
              />
              {line.name}
            </label>
          ))}
        </fieldset>
      </div>

      {sections.length === 0 && (
        <div className="empty">
          <p>No station matches “{query.trim()}”. Check the spelling or try part of the name.</p>
        </div>
      )}

      {sections.map(({ line, stations: list }) => {
        const open = isLineOpen(line, now);
        return (
          <section key={line.id} className="station-section">
            <h2>
              {line.name}
              <span className="station-section__meta">
                {list.length} {list.length === 1 ? 'station' : 'stations'}, {formatHhmm(line.firstTrain)} to {formatHhmm(line.lastTrain)}
              </span>
            </h2>
            <ul className="station-list">
              {list.map((station) => (
                <StationRow key={station.stationId} station={station} open={open} now={now} linked={!search} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
