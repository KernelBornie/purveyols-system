const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  projectTitle: { type: String, required: true },
  client: { type: String },
  location: { type: String },
  budget: { type: String },
  deadline: { type: String },
  source: { type: String },
  sourceUrl: { type: String },
  description: { type: String },
  skills: [String],
  contactEmail: { type: String },
  biddingFee: { type: String },
  
  status: {
    type: String,
    enum: ['bidded', 'shortlisted', 'interviewing', 'awarded', 'lost', 'withdrawn'],
    default: 'bidded'
  },
  bidAmount: { type: String },
  bidDate: { type: Date, default: Date.now },
  notes: { type: String },
  followUpDate: { type: Date },
  contactPerson: { type: String },
  contactPhone: { type: String },
  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  convertedToProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  isConverted: { type: Boolean, default: false },

  convertedToTender: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender' },
  isConvertedToTender: { type: Boolean, default: false },
});

module.exports = mongoose.model('Bid', BidSchema);