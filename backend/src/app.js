const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/stations', require('./routes/stations'));
  app.use('/api/lines', require('./routes/lines'));
  app.use('/api/routes', require('./routes/plans'));
  app.use('/api/favorites', require('./routes/favorites'));
  app.use('/api/journeys', require('./routes/journeys'));

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
