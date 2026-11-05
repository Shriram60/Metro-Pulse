const express = require('express');
const { LINES } = require('../data/stations');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(LINES);
});

module.exports = router;
