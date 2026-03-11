const mongoose = require('mongoose');

const driverLogbookSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleNumber: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    timeIn: { type: String, required: true },
    timeOut: { type: String, required: true },
    distanceKm: { type: Number, required: true, min: 0 },
    fuelLitres: { type: Number, required: true, min: 0 },
    route: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    site: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

driverLogbookSchema.index({ driver: 1, date: -1 });
driverLogbookSchema.index({ date: -1 });

module.exports = mongoose.model('DriverLogbook', driverLogbookSchema);
