const mongoose = require('mongoose');

// A route a user saved to their favorites.
const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromStationId: { type: String, required: true },
  toStationId: { type: String, required: true },
  fromStation: { type: String, required: true },
  toStation: { type: String, required: true },
  fromLine: { type: String, required: true },
  toLine: { type: String, required: true },
  stops: { type: Number },
  fare: { type: Number },
  label: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

routeSchema.index({ userId: 1, fromStationId: 1, toStationId: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);
