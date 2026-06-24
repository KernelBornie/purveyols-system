const mongoose = require('mongoose');

const FundingRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: Number,
  description: String,
  recipientPhone: { type: String, default: '' }, // 👈 NEW
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'funded'],
    default: 'pending'
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fundedAt: Date,
  rejectionReason: String,
  updatedAt: Date,
});

module.exports = mongoose.model('FundingRequest', FundingRequestSchema);