import { useApp } from '../context';
import { formatHhmm, isLineOpen, useNow } from '../lib/time';
import { busiestStations, stationsOnLine } from '../lib/network';
import { href } from '../lib/router';
import CrowdMeter from '../components/CrowdMeter';
import LineMark from '../components/LineMark';
import NetworkMap from '../components/NetworkMap';

function LineStatus({ line, stations, now }) {
  const onLine = stationsOnLine(stations, line.id);
  const open = isLineOpen(line, now);
  return (
    <li className={`line-status line-status--${line.id}`}>
      <h2>{line.name}</h2>
      <p className="line-status__state">
        {open ? `Running until ${formatHhmm(line.lastTrain)}` : `Closed, opens at ${formatHhmm(line.firstTrain)}`}
      </p>
      <p className="line-status__ends">
        {onLine[0].name} to {onLine[onLine.length - 1].name}, {onLine.length} stations
      </p>
    </li>
  );
}

export default function Home() {
  const { stations, lines } = useApp();
  const now = useNow();

  const openLines = new Set(lines.filter((line) => isLineOpen(line, now)).map((line) => line.id));
  const running = openLines.size > 0;
  const busiest = busiestStations(stations.filter((station) => openLines.has(station.line)), now);
  const firstTrain = lines.map((line) => line.firstTrain).sort()[0];

  return (
    <>
      <div className="page-head">
        <h1>Bangalore metro right now</h1>
        <p>
          A bigger halo means a busier station. Crowd levels are simulated from the time, the day
          and the type of station.
        </p>
      </div>

      <ul className="line-statuses">
        {lines.map((line) => <LineStatus key={line.id} line={line} stations={stations} now={now} />)}
      </ul>

      <div className="home-grid">
        <NetworkMap stations={stations} now={now} isLineOpen={(id) => openLines.has(id)} />

        <aside className="busiest">
          <h2>Busiest stations</h2>
          {running ? (
            <ol>
              {busiest.map((station) => (
                <li key={station.stationId}>
                  <a href={href('planner', { from: station.stationId })}>{station.name}</a>
                  <span className="busiest__lines">
                    {station.lines.map((line) => <LineMark key={line} line={line} />)}
                  </span>
                  <CrowdMeter level={station.crowd} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Trains are not running. Service starts at {formatHhmm(firstTrain)}.</p>
          )}
          <a className="button" href={href('planner')}>Plan a trip</a>
        </aside>
      </div>
    </>
  );
}
