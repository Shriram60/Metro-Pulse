import { render, screen } from '@testing-library/react';
import RouteStrip, { buildRows } from '../components/RouteStrip';

const route = {
  legs: [
    {
      line: 'purple',
      towards: 'Challaghatta',
      stations: [
        { stationId: 'PL22', name: 'Central College', type: 'business_district', minute: 0 },
        { stationId: 'PL23', name: 'Majestic', type: 'interchange', minute: 2 },
      ],
    },
    {
      line: 'green',
      towards: 'Silk Institute',
      stations: [
        { stationId: 'GL17', name: 'Majestic', type: 'interchange', minute: 7 },
        { stationId: 'GL18', name: 'Chickpete', type: 'business_district', minute: 9 },
        { stationId: 'GL19', name: 'KR Market', type: 'business_district', minute: 11 },
      ],
    },
  ],
};

test('the shared station becomes one interchange row', () => {
  const rows = buildRows(route);

  expect(rows.map((row) => row.kind)).toEqual(['start', 'change', 'stop', 'end']);
  expect(rows[1]).toMatchObject({ above: 'purple', below: 'green' });
  expect(rows.filter((row) => row.station.name === 'Majestic')).toHaveLength(1);
});

test('the strip tells the rider what to do at each step', () => {
  render(<RouteStrip route={route} departure={new Date(2026, 10, 2, 9, 0)} />);

  expect(screen.getByText('Board the Purple Line towards Challaghatta')).toBeInTheDocument();
  expect(screen.getByText('Change to the Green Line towards Silk Institute')).toBeInTheDocument();
  expect(screen.getByText('Your stop')).toBeInTheDocument();
  expect(screen.getByText('9:11 AM')).toBeInTheDocument();
});
