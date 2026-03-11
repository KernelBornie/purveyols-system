const mongoose = require('mongoose');

const safetyReportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    site: { type: String, required: true, trim: true },
    incidentType: {
      type: String,
      enum: ['near-miss', 'minor-injury', 'major-injury', 'fatality', 'property-damage', 'hazard'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    actionTaken: { type: String, trim: true },
    status: { type: String, enum: ['open', 'investigating', 'closed'], default: 'open' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  },
  { timestamps: true }
);

safetyReportSchema.index({ site: 1, date: -1 });
safetyReportSchema.index({ status: 1 });

module.exports = mongoose.model('SafetyReport', safetyReportSchema);
