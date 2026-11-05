require('dotenv').config();

const mongoose = require('mongoose');
const createApp = require('./src/app');
const seedStations = require('./src/seed');

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/metropulse';
  const port = process.env.PORT || 5000;

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
  await seedStations();

  return new Promise((resolve, reject) => {
    const server = createApp().listen(port, () => {
      console.log(`API running at http://localhost:${port}/api`);
      resolve(server);
    });
    server.once('error', reject);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error(`Could not start the server: ${err.message}`);
    process.exit(1);
  });
}

module.exports = start;
