const express = require('express');
const Journey = require('../models/Journey');
const requireAuth = require('../middleware/auth');
const { planTrip } = require('../services/routePlanner');
const { HttpError, asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Journey.find({ userId: req.userId }).sort({ departureTime: -1 }));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { from, to, departureTime, crowdLevel } = req.body;

  const departure = new Date(departureTime);
  if (!departureTime || Number.isNaN(departure.getTime())) {
    throw new HttpError(400, 'Enter a valid departure time');
  }

  const trip = await planTrip(from, to);
  const journey = await Journey.create({
    userId: req.userId,
    fromStationId: from,
    toStationId: to,
    fromStation: trip.from.name,
    toStation: trip.to.name,
    departureTime: departure,
    crowdLevel,
    fare: trip.fare,
    stops: trip.stops,
    interchanges: trip.interchanges,
    duration: trip.minutes,
  });

  res.status(201).json(journey);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const journey = await Journey.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!journey) throw new HttpError(404, 'Trip not found');
  res.json({ message: 'Trip removed' });
}));

module.exports = router;
