const mongoose = require('mongoose');

// ─── Document schema ──────────────────────────────────────────────
const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String },
  url: { type: String },
  mimeType: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'rejected'],
    default: 'planning'
  },
  budget: Number,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  image: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  bidSource: { type: String, default: '' },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bidAmount: { type: Number, default: 0 },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timeFrame: { type: String, default: '' },
  isFromBid: { type: Boolean, default: false },
  sourceUrl: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  isFromTender: { type: Boolean, default: false },
  tenderSource: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender' },
  documents: [DocumentSchema],   // ✅ New field
  awardedBidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
});

module.exports = mongoose.model('Project', ProjectSchema);