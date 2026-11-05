const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  line: { type: String, required: true },
  type: {
    type: String,
    enum: ['tech_hub', 'business_district', 'residential_area', 'interchange', 'mid_line'],
  },
  operational: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Station', stationSchema);
