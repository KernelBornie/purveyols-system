const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['Drawing', 'BOQ', 'Survey'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  step: { type: String, enum: ['submitted', 'checked', 'approved', 'rejected'], required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Approval', ApprovalSchema);
