const express = require('express');
const Station = require('../models/Station');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await Station.find().sort({ stationId: 1 }));
}));

router.get('/line/:line', asyncHandler(async (req, res) => {
  res.json(await Station.find({ line: req.params.line }).sort({ stationId: 1 }));
}));

module.exports = router;
