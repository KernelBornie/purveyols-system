const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['worker', 'driver', 'foreman', 'engineer', 'other'],
      default: 'worker'
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    phone: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', WorkerSchema);
