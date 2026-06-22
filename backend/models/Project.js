const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['planning','active','paused','completed','rejected'], default: 'planning' },
  budget: Number,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },

  // ─── New fields for awarded bids ──────────────────────────
  bidSource: { type: String, default: '' },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bidAmount: { type: Number, default: 0 },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timeFrame: { type: String, default: '' },
  isFromBid: { type: Boolean, default: false },
  sourceUrl: { type: String, default: '' },
});

module.exports = mongoose.model('Project', ProjectSchema);
