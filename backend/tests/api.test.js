const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';

const createApp = require('../src/app');
const seedStations = require('../src/seed');
const User = require('../src/models/User');
const Route = require('../src/models/Route');

let mongod;
let app;

async function signUp(name) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: name, email: `${name}@example.com`, password: 'password123' })
    .expect(201);
  return res.body.token;
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('metropulse-test'));
  await seedStations();
  await Promise.all([User.init(), Route.init()]);
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('seeding fills the network once', async () => {
  await seedStations();
  const res = await request(app).get('/api/stations').expect(200);
  assert.equal(res.body.length, 85);
});

test('stations can be listed by line, in order', async () => {
  const res = await request(app).get('/api/stations/line/yellow').expect(200);
  assert.equal(res.body.length, 16);
  assert.equal(res.body[0].name, 'RV Road');
  assert.equal(res.body[15].name, 'Bommasandra');
});

test('lines report their hours', async () => {
  const res = await request(app).get('/api/lines').expect(200);
  assert.deepEqual(res.body.map((line) => line.id), ['purple', 'green', 'yellow']);
  assert.equal(res.body[2].firstTrain, '06:30');
});

test('the plan endpoint returns a route', async () => {
  const res = await request(app).get('/api/routes/plan?from=PL19&to=GL19').expect(200);
  assert.equal(res.body.stations, 7);
  assert.equal(res.body.interchanges, 1);
  assert.equal(res.body.fare, 60);
});

test('the plan endpoint rejects bad trips', async () => {
  await request(app).get('/api/routes/plan').expect(400);
  await request(app).get('/api/routes/plan?from=PL23&to=GL17').expect(400);
  await request(app).get('/api/routes/plan?from=PL23&to=PL23').expect(400);
  await request(app).get('/api/routes/plan?from=NOPE&to=GL17').expect(404);
});

test('registering validates its input', async () => {
  const register = (body) => request(app).post('/api/auth/register').send(body);

  await register({ username: 'x', email: 'a@example.com', password: 'password123' }).expect(400);
  await register({ username: 'valid', email: 'not-an-email', password: 'password123' }).expect(400);
  await register({ username: 'valid', email: 'a@example.com', password: 'short' }).expect(400);
  await register({ username: 'valid', email: 'a@example.com' }).expect(400);
});

test('a duplicate account is refused', async () => {
  await signUp('dupe');
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'dupe2', email: 'DUPE@example.com', password: 'password123' })
    .expect(409);
  assert.match(res.body.message, /email/);
});

test('logging in checks the password', async () => {
  await signUp('login');
  const login = (body) => request(app).post('/api/auth/login').send(body);

  const ok = await login({ email: 'LOGIN@example.com', password: 'password123' }).expect(200);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.password, undefined);

  await login({ email: 'login@example.com', password: 'wrong-password' }).expect(401);
  await login({ email: 'nobody@example.com', password: 'password123' }).expect(401);
  await login({ email: { $gt: '' }, password: 'password123' }).expect(400);
});

test('the profile needs a valid token and hides the password', async () => {
  await request(app).get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set(bearer('forged')).expect(401);

  const token = await signUp('profile');
  const res = await request(app).get('/api/auth/me').set(bearer(token)).expect(200);
  assert.equal(res.body.username, 'profile');
  assert.equal(res.body.password, undefined);
});

test('the profile can be updated', async () => {
  const token = await signUp('editor');
  const patch = (body) => request(app).patch('/api/auth/me').set(bearer(token)).send(body);

  const res = await patch({ username: 'editor2', phone: '12345', homeStation: 'PL16' }).expect(200);
  assert.equal(res.body.username, 'editor2');
  assert.equal(res.body.homeStation, 'PL16');

  await patch({ homeStation: 'NOPE' }).expect(400);
  await patch({ username: 'x' }).expect(400);

  const cleared = await patch({ homeStation: '' }).expect(200);
  assert.equal(cleared.body.homeStation, undefined);
});

test('favorites work end to end and refuse duplicates', async () => {
  const token = await signUp('fav');
  const auth = bearer(token);

  await request(app).get('/api/favorites').expect(401);

  const created = await request(app)
    .post('/api/favorites')
    .set(auth)
    .send({ from: 'PL19', to: 'GL19', label: 'Market', fare: 1 })
    .expect(201);
  assert.equal(created.body.fromStation, 'MG Road');
  assert.equal(created.body.fare, 60, 'the fare comes from the server, not the client');

  await request(app).post('/api/favorites').set(auth).send({ from: 'PL19', to: 'GL19' }).expect(409);

  const list = await request(app).get('/api/favorites').set(auth).expect(200);
  assert.equal(list.body.length, 1);

  await request(app).delete(`/api/favorites/${created.body._id}`).set(auth).expect(200);
  const empty = await request(app).get('/api/favorites').set(auth).expect(200);
  assert.equal(empty.body.length, 0);
});

test('users cannot touch each other\'s favorites', async () => {
  const owner = bearer(await signUp('owner'));
  const other = bearer(await signUp('other'));

  const { body: route } = await request(app)
    .post('/api/favorites')
    .set(owner)
    .send({ from: 'PL01', to: 'PL02' })
    .expect(201);

  await request(app).delete(`/api/favorites/${route._id}`).set(other).expect(404);

  const list = await request(app).get('/api/favorites').set(owner).expect(200);
  assert.equal(list.body.length, 1);

  const theirs = await request(app).get('/api/favorites').set(other).expect(200);
  assert.equal(theirs.body.length, 0);
});

test('a malformed id is a client error', async () => {
  const auth = bearer(await signUp('badid'));
  await request(app).delete('/api/favorites/not-an-id').set(auth).expect(400);
});

test('journeys are logged, listed newest first and private', async () => {
  const auth = bearer(await signUp('rider'));
  const stranger = bearer(await signUp('stranger'));
  const log = (body) => request(app).post('/api/journeys').set(auth).send(body);

  await log({ from: 'PL19', to: 'GL19' }).expect(400);
  await log({ from: 'PL19', to: 'PL19', departureTime: '2026-01-01T09:00:00Z' }).expect(400);
  await log({ from: 'PL19', to: 'GL19', departureTime: '2026-01-01T09:00:00Z', crowdLevel: 500 }).expect(400);

  const first = await log({ from: 'PL19', to: 'GL19', departureTime: '2026-01-01T09:00:00Z', crowdLevel: 60 }).expect(201);
  assert.equal(first.body.fare, 60);
  assert.equal(first.body.stops, 6);
  assert.equal(first.body.interchanges, 1);
  assert.ok(first.body.duration > 0);

  await log({ from: 'PL16', to: 'PL19', departureTime: '2026-02-01T09:00:00Z', crowdLevel: 30 }).expect(201);

  const list = await request(app).get('/api/journeys').set(auth).expect(200);
  assert.deepEqual(list.body.map((trip) => trip.toStation), ['MG Road', 'KR Market']);

  const theirs = await request(app).get('/api/journeys').set(stranger).expect(200);
  assert.equal(theirs.body.length, 0);

  await request(app).delete(`/api/journeys/${first.body._id}`).set(stranger).expect(404);
  await request(app).delete(`/api/journeys/${first.body._id}`).set(auth).expect(200);
});

test('bad JSON and unknown endpoints get clear errors', async () => {
  const bad = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{not json')
    .expect(400);
  assert.match(bad.body.message, /JSON/);

  await request(app).get('/api/nothing-here').expect(404);
});
