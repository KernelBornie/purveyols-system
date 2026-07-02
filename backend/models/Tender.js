const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  referenceNumber: { type: String, unique: true },
  client: { type: String },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'verified', 'awarded', 'rejected'],
    default: 'draft'
  },
  type: { type: String, default: 'tender' },
  description: { type: String },
  location: { type: String },
  sourceUrl: { type: String },
  image: { type: String },
  priceProposal: {
    subTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  // ─── Documents array (for uploaded files) ───────────
  documents: [{
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    extension: { type: String },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // ─── Audit trail fields ──────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  convertedToProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  assignedAt: { type: Date },
  verifiedAt: { type: Date },
  awardDate: { type: Date },
  awardAmount: { type: Number },
  awardee: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tender', tenderSchema);