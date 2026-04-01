const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true, default: 'present' },
    overtimeHours: { type: Number, default: 0, min: 0 },
    overtimeRate: { type: Number, default: 0, min: 0 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for same worker on same date
AttendanceSchema.index({ worker: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
