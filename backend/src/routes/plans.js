const express = require('express');
const { planTrip } = require('../services/routePlanner');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

// GET /api/routes/plan?from=PL19&to=GL19
router.get('/plan', asyncHandler(async (req, res) => {
  res.json(await planTrip(req.query.from, req.query.to));
}));

module.exports = router;
