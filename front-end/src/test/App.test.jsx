import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

const stations = [
  { stationId: 'GL17', name: 'Majestic', line: 'green', type: 'interchange', operational: true },
  { stationId: 'GL18', name: 'Chickpete', line: 'green', type: 'business_district', operational: true },
  { stationId: 'PL22', name: 'Central College', line: 'purple', type: 'business_district', operational: true },
  { stationId: 'PL23', name: 'Majestic', line: 'purple', type: 'interchange', operational: true },
  { stationId: 'YL01', name: 'RV Road', line: 'yellow', type: 'interchange', operational: true },
  { stationId: 'YL02', name: 'Ragigudda', line: 'yellow', type: 'mid_line', operational: true },
];

const lines = [
  { id: 'purple', name: 'Purple Line', firstTrain: '05:30', lastTrain: '23:30' },
  { id: 'green', name: 'Green Line', firstTrain: '05:30', lastTrain: '23:30' },
  { id: 'yellow', name: 'Yellow Line', firstTrain: '06:30', lastTrain: '23:30' },
];

const route = {
  from: { stationId: 'PL22', name: 'Central College', line: 'purple' },
  to: { stationId: 'GL18', name: 'Chickpete', line: 'green' },
  stations: 3,
  stops: 2,
  interchanges: 1,
  fare: 20,
  minutes: 9,
  legs: [
    { line: 'purple', towards: 'Challaghatta', stations: [
      { stationId: 'PL22', name: 'Central College', minute: 0 },
      { stationId: 'PL23', name: 'Majestic', minute: 2 },
    ] },
    { line: 'green', towards: 'Silk Institute', stations: [
      { stationId: 'GL17', name: 'Majestic', minute: 7 },
      { stationId: 'GL18', name: 'Chickpete', minute: 9 },
    ] },
  ],
};

function json(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
}

function mockServer(handlers = {}) {
  vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
    const path = url.replace('/api', '');
    const key = `${options.method || 'GET'} ${path.split('?')[0]}`;
    if (handlers[key]) return handlers[key](options);
    if (path === '/stations') return json(stations);
    if (path === '/lines') return json(lines);
    return json({ message: 'Not found' }, 404);
  }));
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('the home page shows every line', async () => {
  mockServer();
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Bangalore metro right now' })).toBeInTheDocument();
  for (const line of lines) {
    expect(screen.getByRole('heading', { name: line.name })).toBeInTheDocument();
  }
});

test('a server failure is explained and can be retried', async () => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  render(<App />);

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Cannot reach the server');

  mockServer();
  await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Bangalore metro right now' })).toBeInTheDocument();
});

test('the planner finds a route and shows the change', async () => {
  mockServer({ 'GET /routes/plan': () => json(route) });
  render(<App />);
  await screen.findByRole('heading', { name: 'Bangalore metro right now' });

  await userEvent.click(screen.getByRole('link', { name: 'Planner' }));
  await screen.findByRole('heading', { name: 'Plan a trip' });

  await userEvent.selectOptions(screen.getByLabelText('From'), 'PL22');
  await userEvent.selectOptions(screen.getByLabelText('To'), 'GL18');
  await userEvent.click(screen.getByRole('button', { name: 'Find route' }));

  expect(await screen.findByRole('heading', { name: 'Central College to Chickpete' })).toBeInTheDocument();
  expect(screen.getByText('₹20')).toBeInTheDocument();
  expect(screen.getByText('Change to the Green Line towards Silk Institute')).toBeInTheDocument();
});

test('the planner shows the reason when a trip is refused', async () => {
  mockServer({ 'GET /routes/plan': () => json({ message: 'Choose two different stations' }, 400) });
  window.location.hash = '#/planner?from=PL23&to=GL17';
  render(<App />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Choose two different stations');
});

test('a trip at 3 AM explains the hours and cannot be logged', async () => {
  mockServer({ 'GET /routes/plan': () => json(route) });
  window.location.hash = '#/planner?from=PL22&to=GL18&at=03:00';
  render(<App />);

  const notice = await screen.findByRole('alert');
  expect(notice).toHaveTextContent('This trip does not work leaving at 3:00 AM');
  expect(notice).toHaveTextContent('The Purple Line runs from 5:30 AM to 11:30 PM');
  expect(screen.queryByText(/Average crowd/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log this trip' })).toBeDisabled();
});

test('a late trip warns about the connection it would miss', async () => {
  mockServer({ 'GET /routes/plan': () => json(route) });
  window.location.hash = '#/planner?from=PL22&to=GL18&at=23:28';
  render(<App />);

  const notice = await screen.findByRole('alert');
  expect(notice).toHaveTextContent('The Green Line runs from 5:30 AM to 11:30 PM');
  expect(notice).not.toHaveTextContent('Purple Line');
});

test('station search filters the list', async () => {
  mockServer();
  window.location.hash = '#/stations';
  render(<App />);

  const search = await screen.findByLabelText('Search stations');
  await userEvent.type(search, 'chick');

  expect(screen.getByRole('link', { name: 'Chickpete' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Ragigudda' })).not.toBeInTheDocument();

  await userEvent.clear(search);
  await userEvent.type(search, 'zzz');
  expect(screen.getByText(/No station matches/)).toBeInTheDocument();
});

test('favorites and history ask you to log in first', async () => {
  mockServer();
  window.location.hash = '#/history';
  render(<App />);

  expect(await screen.findByText('Log in to keep a log of your trips.')).toBeInTheDocument();
});

test('logging in shows the username in the masthead', async () => {
  mockServer({
    'POST /auth/login': () => json({ token: 'abc', user: { username: 'asha' } }),
  });
  render(<App />);
  await screen.findByRole('heading', { name: 'Bangalore metro right now' });

  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  const dialog = screen.getByRole('dialog', { hidden: true });
  await userEvent.type(within(dialog).getByLabelText('Email'), 'asha@example.com');
  await userEvent.type(within(dialog).getByLabelText('Password'), 'password123');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Log in' }));

  expect(await screen.findByRole('link', { name: 'asha' })).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBe('abc');
});

test('a wrong password stays in the dialog with the reason', async () => {
  mockServer({
    'POST /auth/login': () => json({ message: 'Incorrect email or password' }, 401),
  });
  render(<App />);
  await screen.findByRole('heading', { name: 'Bangalore metro right now' });

  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  const dialog = screen.getByRole('dialog', { hidden: true });
  await userEvent.type(within(dialog).getByLabelText('Email'), 'asha@example.com');
  await userEvent.type(within(dialog).getByLabelText('Password'), 'nope');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Log in' }));

  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Incorrect email or password');
  expect(localStorage.getItem('token')).toBeNull();
});
