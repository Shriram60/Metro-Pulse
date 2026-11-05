import { crowdLevel } from '../lib/crowd';
import { formatClock } from '../lib/time';
import CrowdMeter from './CrowdMeter';
import { lineName } from './LineMark';

const MINUTE = 60 * 1000;

// Flattens the legs into one row per station. The station where two legs meet
// becomes a single interchange row with a different line above and below it.
export function buildRows(route) {
  const rows = [];

  route.legs.forEach((leg, legIndex) => {
    const nextLeg = route.legs[legIndex + 1];

    leg.stations.forEach((station, stationIndex) => {
      const isLegStart = stationIndex === 0;
      const isLegEnd = stationIndex === leg.stations.length - 1;

      if (isLegStart && legIndex > 0) return;

      if (isLegStart) {
        rows.push({ kind: 'start', station, below: leg.line, note: `Board the ${lineName(leg.line)} towards ${leg.towards}` });
      } else if (isLegEnd && nextLeg) {
        rows.push({
          kind: 'change',
          station,
          above: leg.line,
          below: nextLeg.line,
          note: `Change to the ${lineName(nextLeg.line)} towards ${nextLeg.towards}`,
        });
      } else if (isLegEnd) {
        rows.push({ kind: 'end', station, above: leg.line, note: 'Your stop' });
      } else {
        rows.push({ kind: 'stop', station, above: leg.line, below: leg.line });
      }
    });
  });

  return rows;
}

export default function RouteStrip({ route, departure, showCrowd = true }) {
  return (
    <ol className="strip">
      {buildRows(route).map(({ kind, station, above, below, note }) => {
        const major = kind !== 'stop';
        const arrival = new Date(departure.getTime() + station.minute * MINUTE);
        return (
          <li key={station.stationId} className={`strip-row strip-row--${kind}`}>
            <span className="strip-time">{major && formatClock(arrival)}</span>
            <span className="strip-rail" aria-hidden="true">
              {above && <i className={`rail rail--above rail--${above}`} />}
              {below && <i className={`rail rail--below rail--${below}`} />}
              <b className={`strip-dot strip-dot--${kind}`} />
            </span>
            <span className="strip-name">
              <span className="strip-station">{station.name}</span>
              {note && <span className="strip-note">{note}</span>}
            </span>
            {major && showCrowd && <span className="strip-crowd"><CrowdMeter level={crowdLevel(station, arrival)} /></span>}
          </li>
        );
      })}
    </ol>
  );
}
