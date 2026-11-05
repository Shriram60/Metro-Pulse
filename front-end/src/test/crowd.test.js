import { averageByDay, averageByHour, crowdBand, crowdLevel } from '../lib/crowd';

const hub = { name: 'Majestic', type: 'interchange', line: 'purple' };
const quiet = { name: 'Hoodi', type: 'mid_line', line: 'purple' };

// 2 November 2026 is a Monday.
const monday = (hour, minute = 0) => new Date(2026, 10, 2, hour, minute);
const sunday = (hour) => new Date(2026, 10, 1, hour);

test('levels stay between 0 and 100 at every hour of every day', () => {
  for (let day = 1; day <= 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const level = crowdLevel(hub, new Date(2026, 10, day, hour));
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(100);
    }
  }
});

test('rush hour does not flatten every station to 100', () => {
  expect(crowdLevel(quiet, monday(8))).toBeLessThan(75);
  expect(crowdLevel(hub, monday(18))).toBeGreaterThan(crowdLevel(quiet, monday(18)));
});

test('stations are empty overnight', () => {
  expect(crowdLevel(hub, monday(3))).toBe(0);
});

test('rush hour is busier than mid afternoon, and weekdays than Sunday', () => {
  expect(crowdLevel(hub, monday(18))).toBeGreaterThan(crowdLevel(hub, monday(15)));
  expect(crowdLevel(hub, monday(18))).toBeGreaterThan(crowdLevel(hub, sunday(18)));
});

test('a level holds steady for ten minutes so pages agree', () => {
  expect(crowdLevel(hub, monday(18, 1))).toBe(crowdLevel(hub, monday(18, 9)));
});

test('both platforms of an interchange read the same', () => {
  const purple = { ...hub, line: 'purple', stationId: 'PL23' };
  const green = { ...hub, line: 'green', stationId: 'GL17' };
  expect(crowdLevel(purple, monday(18))).toBe(crowdLevel(green, monday(18)));
});

test('bands follow the thresholds', () => {
  expect(crowdBand(39)).toBe('Low');
  expect(crowdBand(40)).toBe('Medium');
  expect(crowdBand(69)).toBe('Medium');
  expect(crowdBand(70)).toBe('High');
});

test('averages cover service hours and the whole week', () => {
  const stations = [hub, quiet];
  const hourly = averageByHour(stations, 1);
  expect(hourly[0].hour).toBe(5);
  expect(hourly.at(-1).hour).toBe(23);

  const daily = averageByDay(stations);
  expect(daily).toHaveLength(7);
  expect(daily[1].value).toBeGreaterThan(daily[0].value);
});
