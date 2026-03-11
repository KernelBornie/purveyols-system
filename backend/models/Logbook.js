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
    fuelUsed: { type: Number },
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
