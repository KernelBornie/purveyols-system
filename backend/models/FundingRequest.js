const mongoose = require('mongoose');
const FundingRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: Number,
  description: String,
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
});
module.exports = mongoose.model('FundingRequest', FundingRequestSchema);
