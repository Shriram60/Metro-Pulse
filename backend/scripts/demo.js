// Runs the API against a throwaway in-memory MongoDB with a sample account, so
// the app can be tried without installing anything. Data is lost on exit.
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'metropulse';
const DAY = 24 * 60 * 60 * 1000;

const FAVORITES = [
  ['PL16', 'YL12', 'Office commute'],
  ['PL16', 'GL10', 'Yeshwanthpur market'],
  ['PL19', 'GL19', 'KR Market run'],
];

// [days ago, hour, minute, from, to, crowd]
const TRIPS = [
  [1, 8, 40, 'PL16', 'YL12', 84],
  [1, 18, 15, 'YL12', 'PL16', 88],
  [2, 8, 35, 'PL16', 'YL12', 81],
  [2, 18, 30, 'YL12', 'PL16', 86],
  [3, 9, 5, 'PL16', 'YL12', 76],
  [3, 19, 10, 'YL12', 'PL16', 79],
  [6, 11, 20, 'PL16', 'GL10', 31],
  [6, 16, 45, 'GL10', 'PL16', 27],
  [8, 8, 45, 'PL16', 'YL12', 83],
  [9, 13, 0, 'PL19', 'GL19', 52],
];

async function seedDemoData() {
  const User = require('../src/models/User');
  const Route = require('../src/models/Route');
  const Journey = require('../src/models/Journey');
  const { planTrip } = require('../src/services/routePlanner');

  const user = await User.create({
    username: 'demo',
    email: DEMO_EMAIL,
    homeStation: 'PL16',
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
  });

  for (const [from, to, label] of FAVORITES) {
    const trip = await planTrip(from, to);
    await Route.create({
      userId: user._id,
      fromStationId: from,
      toStationId: to,
      fromStation: trip.from.name,
      toStation: trip.to.name,
      fromLine: trip.from.line,
      toLine: trip.to.line,
      stops: trip.stops,
      fare: trip.fare,
      label,
    });
  }

  for (const [daysAgo, hour, minute, from, to, crowdLevel] of TRIPS) {
    const trip = await planTrip(from, to);
    const departureTime = new Date(Date.now() - daysAgo * DAY);
    departureTime.setHours(hour, minute, 0, 0);
    await Journey.create({
      userId: user._id,
      fromStationId: from,
      toStationId: to,
      fromStation: trip.from.name,
      toStation: trip.to.name,
      departureTime,
      crowdLevel,
      fare: trip.fare,
      stops: trip.stops,
      interchanges: trip.interchanges,
      duration: trip.minutes,
    });
  }
}

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('metropulse');

  const start = require('../server');
  await start();
  await seedDemoData();

  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  const stop = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error(`Could not start the demo: ${err.message}`);
  process.exit(1);
});
