import { useMemo, useState } from 'react';
import { crowdLevel, crowdBand } from '../lib/crowd';
import { LABELS, LINE_LABELS, VIEW, linePath, stationPosition } from '../lib/diagram';
import { physicalStations } from '../lib/network';
import { href } from '../lib/router';
import CrowdMeter from './CrowdMeter';
import { lineName } from './LineMark';

const MIN_HALO = 6;
const MAX_HALO = 20;

const haloRadius = (crowd) => MIN_HALO + (crowd / 100) * (MAX_HALO - MIN_HALO);
const isTouchScreen = () => window.matchMedia?.('(hover: none)')?.matches ?? false;

function Key() {
  const samples = [[20, 'Low'], [55, 'Medium'], [90, 'High']];
  return (
    <g transform="translate(830 40)" className="diagram-key">
      <text x="0" y="0" className="diagram-key__title">Crowd at each station</text>
      {samples.map(([crowd, label], index) => (
        <g key={label} transform={`translate(${18 + index * 72} 36)`}>
          <circle r={haloRadius(crowd)} className={`halo halo--${label.toLowerCase()}`} />
          <circle r="5" className="stop" />
          <text y="38" textAnchor="middle">{label}</text>
        </g>
      ))}
    </g>
  );
}

export default function NetworkMap({ stations, now, isLineOpen, skipTo }) {
  const [active, setActive] = useState(null);

  const places = useMemo(() => physicalStations(stations).map((station) => ({
    ...station,
    position: stationPosition(station),
  })), [stations]);

  const running = (station) => station.lines.some(isLineOpen);
  const crowdOf = (station) => (running(station) ? crowdLevel(station, now) : 0);

  const busiest = places.reduce(
    (top, station) => (crowdOf(station) > (top ? crowdOf(top) : 0) ? station : top),
    null,
  );

  const describe = (station) => {
    const crowd = running(station) ? `${crowdBand(crowdOf(station))} ${crowdOf(station)}%` : 'closed';
    return `${station.name}, ${station.lines.map(lineName).join(' and ')}, ${crowd}. Plan a trip from here.`;
  };

  // A touch screen cannot hover, so the first tap shows the details and the
  // second opens the planner.
  function selectStop(event, station) {
    if (isTouchScreen() && active?.stationId !== station.stationId) {
      event.preventDefault();
      setActive(station);
    }
  }

  function skipDiagram(event) {
    event.preventDefault();
    document.getElementById(skipTo)?.focus();
  }

  return (
    <div className="diagram-wrap">
      <a className="diagram-skip" href={`#${skipTo}`} onClick={skipDiagram}>Skip the diagram</a>
      <div className="diagram">
        <div
          className="diagram-canvas"
          onClick={(event) => {
            if (!event.target.closest('a')) setActive(null);
          }}
        >
          <svg
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            role="group"
            aria-label="Network diagram of the Purple, Green and Yellow lines. Each station links to a trip planned from it and gives its crowd level."
          >
            <g aria-hidden="true">
              {places.map((station) => {
                const crowd = crowdOf(station);
                if (crowd === 0) return null;
                const { x, y } = station.position;
                return (
                  <circle
                    key={station.stationId}
                    cx={x}
                    cy={y}
                    r={haloRadius(crowd)}
                    className={`halo halo--${crowdBand(crowd).toLowerCase()}`}
                  />
                );
              })}

              {busiest && (
                <circle
                  cx={busiest.position.x}
                  cy={busiest.position.y}
                  r={haloRadius(crowdOf(busiest))}
                  className="halo-pulse"
                />
              )}

              <path d={linePath('yellow')} className="diagram-casing" />
              {['purple', 'green', 'yellow'].map((line) => (
                <path key={line} d={linePath(line)} className={`diagram-line diagram-line--${line}`} />
              ))}

              {LINE_LABELS.map(({ id, x, y, anchor }) => (
                <text key={id} x={x} y={y} textAnchor={anchor} className="diagram-line-name">{lineName(id)}</text>
              ))}

              {places.map((station) => {
                const { x, y } = station.position;
                return station.lines.length > 1
                  ? <rect key={station.stationId} x={x - 17} y={y - 9} width="34" height="18" rx="9" className="stop stop--interchange" />
                  : <circle key={station.stationId} cx={x} cy={y} r={LABELS[station.stationId]?.major ? 8 : 5} className="stop" />;
              })}

              {places.map((station) => {
                const label = LABELS[station.stationId];
                if (!label) return null;
                const { x, y } = station.position;
                return (
                  <text
                    key={station.stationId}
                    x={x + label.dx}
                    y={y + label.dy}
                    textAnchor={label.anchor}
                    className={label.major ? 'diagram-label diagram-label--major' : 'diagram-label'}
                  >
                    {label.text || station.name}
                  </text>
                );
              })}

              <Key />
            </g>

            {places.map((station) => {
              const { x, y } = station.position;
              return (
                <a
                  key={station.stationId}
                  href={href('planner', { from: station.stationId })}
                  aria-label={describe(station)}
                  onClick={(event) => selectStop(event, station)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setActive(station);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setActive(null);
                  }}
                  onFocus={(event) => {
                    if (event.target.matches(':focus-visible')) setActive(station);
                  }}
                  onBlur={() => setActive(null)}
                >
                  <circle cx={x} cy={y} r="13" className="diagram-target" />
                </a>
              );
            })}
          </svg>

          {active && (
            <div
              className={[
                'diagram-tip',
                active.position.y < 190 ? 'diagram-tip--below' : '',
                active.position.x > 920 ? 'diagram-tip--end' : '',
                active.position.x < 180 ? 'diagram-tip--start' : '',
              ].join(' ')}
              style={{
                left: `${(active.position.x / VIEW.width) * 100}%`,
                top: `${(active.position.y / VIEW.height) * 100}%`,
              }}
            >
              <strong>{active.name}</strong>
              <span>{active.lines.map(lineName).join(' and ')}</span>
              {running(active) ? <CrowdMeter level={crowdOf(active)} /> : <span>Closed</span>}
              <small>{isTouchScreen() ? 'Tap again to plan a trip from here' : 'Select to plan a trip from here'}</small>
            </div>
          )}
        </div>
      </div>
      <p className="diagram-hint">Swipe sideways to see the whole network, and tap a station for its details.</p>
    </div>
  );
}
