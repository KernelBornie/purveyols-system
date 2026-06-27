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
  // ─── Verification fields ──────────────────────────────────────
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  // ─── New: Profile photo ──────────────────────────────────────
  photo: { type: String, default: '' }, // base64 data URL
});

module.exports = mongoose.model('Worker', WorkerSchema);