const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: Date, default: Date.now },
  site: { type: String, required: true },
  rate: { type: Number, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
