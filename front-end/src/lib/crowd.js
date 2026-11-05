// Crowd levels are simulated, not measured. There is no public live feed for the
// network, so this models how busy a station is likely to be from the type of
// station, the hour and the day.

// Percent full at the height of each part of the day.
const STATION_PEAKS = {
  tech_hub: { morning: 80, midday: 60, evening: 90 },
  business_district: { morning: 85, midday: 70, evening: 80 },
  residential_area: { morning: 75, midday: 40, evening: 85 },
  interchange: { morning: 90, midday: 75, evening: 95 },
  mid_line: { morning: 60, midday: 50, evening: 65 },
};

// Share of that peak reached in each hour. Hours left out have no service.
const HOUR_SHAPE = {
  5: 0.2, 6: 0.4, 7: 0.8, 8: 1, 9: 0.95, 10: 0.7,
  11: 0.8, 12: 1, 13: 0.9, 14: 0.7, 15: 0.7,
  16: 0.6, 17: 0.85, 18: 1, 19: 0.95, 20: 0.65, 21: 0.45, 22: 0.3, 23: 0.12,
};

// Sunday first, relative to Monday, the busiest day.
const DAY_FACTOR = [0.35, 1, 0.96, 0.87, 0.91, 0.83, 0.52];

const NOISE_WINDOW_MS = 10 * 60 * 1000;
const NOISE_RANGE = 4;

export const SERVICE_HOURS = Object.keys(HOUR_SHAPE).map(Number);

function partOfDay(hour) {
  if (hour <= 10) return 'morning';
  return hour <= 15 ? 'midday' : 'evening';
}

function expectedCrowd(type, hour, day) {
  const shape = HOUR_SHAPE[hour];
  if (!shape) return 0;
  const peaks = STATION_PEAKS[type] || STATION_PEAKS.mid_line;
  return peaks[partOfDay(hour)] * shape * DAY_FACTOR[day];
}

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  }
  return value >>> 0;
}

// Stable for ten minutes and keyed by name, so every page agrees on a number
// and both platforms of an interchange read the same.
export function crowdLevel(station, date = new Date()) {
  const expected = expectedCrowd(station.type, date.getHours(), date.getDay());
  if (expected === 0) return 0;

  const windowId = Math.floor(date.getTime() / NOISE_WINDOW_MS);
  const noise = (hash(`${station.name}:${windowId}`) % (NOISE_RANGE * 2 + 1)) - NOISE_RANGE;
  return Math.max(0, Math.min(100, Math.round(expected + noise)));
}

export function crowdBand(level) {
  if (level < 40) return 'Low';
  return level < 70 ? 'Medium' : 'High';
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function averageByHour(stations, day) {
  return SERVICE_HOURS.map((hour) => ({
    hour,
    value: Math.round(mean(stations.map((station) => expectedCrowd(station.type, hour, day)))),
  }));
}

export function averageByDay(stations) {
  return DAY_FACTOR.map((_, day) => ({
    day,
    value: Math.round(mean(averageByHour(stations, day).map((entry) => entry.value))),
  }));
}
