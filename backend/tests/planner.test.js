const test = require('node:test');
const assert = require('node:assert/strict');
const { STATIONS } = require('../src/data/stations');
const { calculateFare, findRoute } = require('../src/services/routePlanner');

const plan = (from, to) => findRoute(STATIONS, from, to);

test('a trip on one line has no interchange', () => {
  const route = plan('PL16', 'PL19'); // Indiranagar to MG Road

  assert.equal(route.stops, 3);
  assert.equal(route.stations, 4);
  assert.equal(route.interchanges, 0);
  assert.equal(route.legs.length, 1);
  assert.equal(route.legs[0].line, 'purple');
  assert.deepEqual(
    route.legs[0].stations.map((station) => station.name),
    ['Indiranagar', 'Halasuru', 'Trinity', 'MG Road'],
  );
});

test('a trip across two lines changes at the shared station', () => {
  const route = plan('PL19', 'GL19'); // MG Road to KR Market

  assert.equal(route.stations, 7);
  assert.equal(route.interchanges, 1);
  assert.deepEqual(route.legs.map((leg) => leg.line), ['purple', 'green']);
  assert.equal(route.legs[0].stations.at(-1).name, 'Majestic');
  assert.equal(route.legs[1].stations[0].name, 'Majestic');
  assert.equal(route.fare, 60);
});

test('the longest kind of trip uses all three lines', () => {
  const route = plan('PL01', 'YL16'); // Whitefield to Bommasandra

  assert.deepEqual(route.legs.map((leg) => leg.line), ['purple', 'green', 'yellow']);
  assert.equal(route.interchanges, 2);
  assert.equal(route.stops, 22 + 7 + 15);
  assert.equal(route.fare, 90);
});

test('legs name the end of the line the train is heading to', () => {
  const outbound = plan('PL19', 'GL19');
  assert.equal(outbound.legs[0].towards, 'Challaghatta');
  assert.equal(outbound.legs[1].towards, 'Silk Institute');

  const inbound = plan('GL32', 'PL01'); // Silk Institute to Whitefield
  assert.equal(inbound.legs[0].towards, 'Madavara');
  assert.equal(inbound.legs[1].towards, 'Whitefield (Kadugodi)');
});

test('a trip can start on either platform of an interchange', () => {
  const fromPurple = plan('PL23', 'GL18'); // Majestic to Chickpete
  const fromGreen = plan('GL17', 'GL18');

  assert.equal(fromPurple.stops, 1);
  assert.equal(fromPurple.interchanges, 0);
  assert.equal(fromGreen.stops, 1);
  assert.equal(fromPurple.legs[0].line, 'green');
});

test('travel time grows with stops and interchanges', () => {
  const direct = plan('PL16', 'PL19');
  const withChange = plan('PL19', 'GL19');

  assert.ok(direct.minutes > 0);
  assert.ok(withChange.minutes > direct.minutes);
  const lastStop = withChange.legs.at(-1).stations.at(-1);
  assert.equal(lastStop.minute, withChange.minutes);
});

test('the same physical station has no route', () => {
  assert.equal(plan('PL23', 'GL17'), null);
  assert.equal(plan('PL23', 'PL23'), null);
});

test('an unknown station has no route', () => {
  assert.equal(plan('PL99', 'GL01'), null);
});

test('fares follow the slabs and stop at the maximum', () => {
  assert.equal(calculateFare(2), 10);
  assert.equal(calculateFare(3), 20);
  assert.equal(calculateFare(8), 60);
  assert.equal(calculateFare(12), 80);
  assert.equal(calculateFare(13), 90);
  assert.equal(calculateFare(85), 90);
});

test('only Majestic and RV Road are shared between lines', () => {
  const lineCounts = new Map();
  for (const { name } of STATIONS) lineCounts.set(name, (lineCounts.get(name) || 0) + 1);

  const shared = [...lineCounts].filter(([, count]) => count > 1).map(([name]) => name);
  assert.deepEqual(shared.sort(), ['Majestic', 'RV Road']);
});

test('every pair of stations is connected', () => {
  const names = new Map(STATIONS.map((station) => [station.name, station.stationId]));
  const [start, ...rest] = names.values();

  for (const id of rest) {
    assert.ok(plan(start, id), `no route from ${start} to ${id}`);
  }
});
