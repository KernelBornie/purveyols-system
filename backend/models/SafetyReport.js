const mongoose = require('mongoose');

const SafetyReportSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    incidentType: {
      type: String,
      enum: ['near-miss', 'minor-injury', 'major-injury', 'fatality', 'property-damage', 'hazard'],
      required: true
    },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    actionTaken: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SafetyReport', SafetyReportSchema);
