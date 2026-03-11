const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nrc: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dailyRate: { type: Number, required: true, min: 0 },
    site: { type: String, required: true, trim: true },
    enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'worker', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workerSchema.index({ nrc: 1 });
workerSchema.index({ site: 1 });

module.exports = mongoose.model('Worker', workerSchema);
