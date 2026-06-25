const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nrc: { type: String, unique: true, required: true },
  phone: String,
  dailyRate: Number,
  site: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  // ─── NEW verification fields ──────────────────────────────────
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
});

module.exports = mongoose.model('Worker', WorkerSchema);