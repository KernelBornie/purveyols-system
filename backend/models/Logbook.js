const mongoose = require('mongoose');

const LogbookSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['work', 'vehicle'], required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workerEnrolled: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    date: { type: Date, required: true, default: Date.now },
    hoursWorked: { type: Number },
    distanceTravelled: { type: Number },
    distanceKm: { type: Number },
    fuelUsed: { type: Number },
    fuelLitres: { type: Number },
    timeIn: { type: String },
    timeOut: { type: String },
    route: { type: String },
    purpose: { type: String },
    site: { type: String },
    notes: { type: String },
    description: { type: String },
    vehicleNumber: { type: String },
    startLocation: { type: String },
    endLocation: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Logbook', LogbookSchema);
