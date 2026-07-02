const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  module: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);