const mongoose = require('mongoose');

// A trip a user logged in their history.
const journeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromStationId: { type: String, required: true },
  toStationId: { type: String, required: true },
  fromStation: { type: String, required: true },
  toStation: { type: String, required: true },
  departureTime: { type: Date, required: true },
  crowdLevel: { type: Number, min: 0, max: 100 },
  fare: { type: Number },
  stops: { type: Number },
  interchanges: { type: Number },
  duration: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Journey', journeySchema);
