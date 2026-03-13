const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nrc: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dailyRate: { type: Number, required: true, min: 0 },
    site: { type: String, required: true, trim: true },
    enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    mobileNetwork: { type: String, enum: ['airtel', 'mtn'], default: 'airtel' },
  },
  { timestamps: true }
);

workerSchema.index({ nrc: 1 });
workerSchema.index({ site: 1 });
workerSchema.index({ enrolledBy: 1 });

module.exports = mongoose.models.Worker || mongoose.model('Worker', workerSchema);