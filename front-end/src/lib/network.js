import { crowdLevel } from './crowd';

export const TYPE_LABELS = {
  tech_hub: 'Tech hub',
  business_district: 'Business district',
  residential_area: 'Residential area',
  interchange: 'Interchange',
};

export function stationsOnLine(stations, lineId) {
  return stations.filter((station) => station.line === lineId);
}

// One entry per physical station, so Majestic is not listed twice.
export function physicalStations(stations) {
  const byName = new Map();
  for (const station of stations) {
    const entry = byName.get(station.name);
    if (entry) entry.lines.push(station.line);
    else byName.set(station.name, { ...station, lines: [station.line] });
  }
  return [...byName.values()];
}

export function busiestStations(stations, date, count = 10) {
  return physicalStations(stations)
    .map((station) => ({ ...station, crowd: crowdLevel(station, date) }))
    .sort((a, b) => b.crowd - a.crowd || a.name.localeCompare(b.name))
    .slice(0, count);
}
