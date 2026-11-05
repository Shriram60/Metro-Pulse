const express = require('express');
const Route = require('../models/Route');
const requireAuth = require('../middleware/auth');
const { planTrip } = require('../services/routePlanner');
const { HttpError, asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Route.find({ userId: req.userId }).sort({ createdAt: -1 }));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { from, to, label } = req.body;
  const trip = await planTrip(from, to);

  const exists = await Route.exists({ userId: req.userId, fromStationId: from, toStationId: to });
  if (exists) throw new HttpError(409, 'That route is already in your favorites');

  const route = await Route.create({
    userId: req.userId,
    fromStationId: from,
    toStationId: to,
    fromStation: trip.from.name,
    toStation: trip.to.name,
    fromLine: trip.from.line,
    toLine: trip.to.line,
    stops: trip.stops,
    fare: trip.fare,
    label: typeof label === 'string' ? label : undefined,
  });

  res.status(201).json(route);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const route = await Route.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!route) throw new HttpError(404, 'Favorite not found');
  res.json({ message: 'Favorite removed' });
}));

module.exports = router;
