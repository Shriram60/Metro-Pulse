import { useState } from 'react';
import { useApp } from '../context';
import { averageByDay, averageByHour, crowdLevel } from '../lib/crowd';
import { stationsOnLine } from '../lib/network';
import { isLineOpen, useNow } from '../lib/time';
import { BarChart, LineChart } from '../components/Charts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const hourLabel = (hour) => {
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

function CrowdByLine({ stations, lines, now }) {
  const rows = lines.map((line) => {
    const onLine = stationsOnLine(stations, line.id);
    const total = onLine.reduce((sum, station) => sum + crowdLevel(station, now), 0);
    return { line, value: Math.round(total / onLine.length), open: isLineOpen(line, now) };
  });

  return (
    <ul className="line-bars">
      {rows.map(({ line, value, open }) => (
        <li key={line.id}>
          <span className="line-bars__name">{line.name}</span>
          <span className="line-bars__track">
            {open && <i className={`line-bars__fill line-bars__fill--${line.id}`} style={{ width: `${value}%` }} />}
          </span>
          <span className="line-bars__value">{open ? `${value}%` : 'Closed'}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Stats() {
  const { stations, lines } = useApp();
  const now = useNow();
  const today = now.getDay();
  const [day, setDay] = useState(today);

  const hourly = averageByHour(stations, day).map(({ hour, value }) => ({ label: hourLabel(hour), hour, value }));
  const currentHour = day === today ? hourly.findIndex((entry) => entry.hour === now.getHours()) : -1;

  const daily = averageByDay(stations);
  const weekly = WEEK.map((index) => ({ label: DAYS[index], value: daily[index].value }));

  return (
    <>
      <div className="page-head">
        <h1>Crowd patterns</h1>
        <p>
          These charts show the crowd model the app uses, not measurements from the network, because
          no live ridership feed is public.
        </p>
      </div>

      <section className="stat-section">
        <h2>Right now, by line</h2>
        <p className="stat-section__note">Average crowd across the stations on each line.</p>
        <CrowdByLine stations={stations} lines={lines} now={now} />
      </section>

      <section className="stat-section">
        <div className="stat-section__head">
          <div>
            <h2>Through the day</h2>
            <p className="stat-section__note">Average crowd across all stations for each hour of service.</p>
          </div>
          <fieldset className="segmented segmented--small">
            <legend className="visually-hidden">Day of the week</legend>
            {WEEK.map((index) => (
              <label key={index} className={day === index ? 'is-selected' : undefined}>
                <input type="radio" name="day" checked={day === index} onChange={() => setDay(index)} />
                {DAYS[index]}
              </label>
            ))}
          </fieldset>
        </div>
        <BarChart
          data={hourly}
          caption={`Average crowd by hour on ${DAYS[day]}`}
          highlight={currentHour}
          highlightLabel="Now"
        />
      </section>

      <section className="stat-section">
        <h2>Through the week</h2>
        <p className="stat-section__note">Average crowd across all stations and service hours for each day.</p>
        <LineChart data={weekly} caption="Average crowd by day of the week" />
      </section>
    </>
  );
}
