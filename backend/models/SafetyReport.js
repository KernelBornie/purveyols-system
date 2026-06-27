const mongoose = require('mongoose');

const SafetyReportSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['draft', 'pending', 'submitted', 'reviewed', 'resolved', 'passed', 'failed'],
    default: 'pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // ─── New: Evidence images ──────────────────────────────────────
  images: [
    {
      name: { type: String, required: true },
      dataURL: { type: String, required: true },
    }
  ],
});

module.exports = mongoose.model('SafetyReport', SafetyReportSchema);