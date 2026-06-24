const mongoose = require('mongoose');

const SubcontractSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  vendor: String,
  service: String,
  amount: Number,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'funded', 'active', 'completed', 'terminated'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  // ─── Approval fields ────────────────────────────────────────
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  // ─── Funding fields ─────────────────────────────────────────
  fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fundedAt: Date,
});

module.exports = mongoose.model('Subcontract', SubcontractSchema);