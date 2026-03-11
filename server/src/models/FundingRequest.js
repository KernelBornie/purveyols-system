const mongoose = require('mongoose');

const fundingRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedByRole: { type: String, required: true },
    // engineer -> accountant, accountant -> director
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disbursed'],
      default: 'pending',
    },
    site: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    approvalNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

fundingRequestSchema.index({ requestedBy: 1, status: 1 });
fundingRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FundingRequest', fundingRequestSchema);
