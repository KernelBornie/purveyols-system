const mongoose = require('mongoose');

const SubcontractSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  vendor: String,
  vendorPhone: String, // 👈 NEW
  service: String,
  amount: Number,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'approved', 'funded', 'completed', 'terminated'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fundedAt: Date,
  description: String,
});

module.exports = mongoose.model('Subcontract', SubcontractSchema);