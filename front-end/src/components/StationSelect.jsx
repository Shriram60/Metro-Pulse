import { useId } from 'react';
import { stationsOnLine } from '../lib/network';

// The label sits beside the select rather than around it, so assistive tech
// does not read out all 85 options as part of the field's name.
export default function StationSelect({ label, value, onChange, lines, stations, emptyLabel, hint, required }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        <option value="">{emptyLabel}</option>
        {lines.map((line) => (
          <optgroup key={line.id} label={line.name}>
            {stationsOnLine(stations, line.id).map((station) => (
              <option key={station.stationId} value={station.stationId}>{station.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint && <small>{hint}</small>}
    </div>
  );
}
