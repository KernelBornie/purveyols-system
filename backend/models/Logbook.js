const mongoose = require('mongoose');

const LogbookSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['work', 'vehicle'], required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hours: { type: Number },
    distance: { type: Number },
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

LogbookSchema.pre('validate', function syncCanonicalFields(next) {
  if (!this.projectId && this.project) this.projectId = this.project;
  if (!this.project && this.projectId) this.project = this.projectId;

  if (!this.workerId && this.worker) this.workerId = this.worker;
  if (!this.worker && this.workerId) this.worker = this.workerId;

  if (this.hours == null && this.hoursWorked != null) this.hours = this.hoursWorked;
  if (this.hoursWorked == null && this.hours != null) this.hoursWorked = this.hours;

  if (this.distance == null && this.distanceTravelled != null) this.distance = this.distanceTravelled;
  if (this.distanceTravelled == null && this.distance != null) this.distanceTravelled = this.distance;
  if (this.distance == null && this.distanceKm != null) this.distance = this.distanceKm;
  if (this.distanceKm == null && this.distance != null) this.distanceKm = this.distance;

  next();
});

module.exports = mongoose.model('Logbook', LogbookSchema);
