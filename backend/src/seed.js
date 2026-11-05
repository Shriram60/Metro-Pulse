const Station = require('./models/Station');
const { STATIONS } = require('./data/stations');

// Fills an empty database with the metro network on first run.
async function seedStations() {
  const count = await Station.countDocuments();
  if (count > 0) return;

  await Station.insertMany(STATIONS);
  console.log(`Seeded ${STATIONS.length} stations`);
}

module.exports = seedStations;
