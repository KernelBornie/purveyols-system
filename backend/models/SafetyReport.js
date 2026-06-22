const mongoose = require('mongoose');
const SafetyReportSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('SafetyReport', SafetyReportSchema);
