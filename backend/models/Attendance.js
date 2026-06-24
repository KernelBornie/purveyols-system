const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: Date, default: Date.now },
  days: { type: Number, default: 1, min: 1 },          // 👈 number of days worked
  rate: { type: Number, required: true },              // daily rate
  total: { type: Number, default: 0 },                 // days * rate (auto-calculated)
  site: { type: String, default: '' },                 // optional site
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save middleware to calculate total
AttendanceSchema.pre('save', function(next) {
  if (this.days && this.rate) {
    this.total = this.days * this.rate;
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);