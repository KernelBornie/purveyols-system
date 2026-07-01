const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  // For bids on real projects (ObjectId)
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project',
    required: false  // now optional
  },
  // For bids on advertised projects (custom string ID)
  advertisedProjectId: {
    type: String,
    required: false,
    index: true
  },
  bidderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    default: 0
  },
  timeline: { 
    type: String, 
    required: true,
    default: 'Not specified'
  },
  documents: [{
    name: { type: String },
    path: { type: String },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: [
      'bidded',        // just marked interest
      'shortlisted',   // client shortlisted
      'interviewing',  // client interviewing
      'awarded',       // won the bid
      'lost',          // bid lost
      'withdrawn',     // withdrawn by bidder
      'pending',       // for project bids (legacy)
      'accepted',      // for project bids (legacy)
      'rejected'       // for project bids (legacy)
    ],
    default: 'bidded'
  },
  bidDate: { 
    type: Date, 
    default: Date.now 
  },
  followUpDate: { type: Date },
  contactPerson: { type: String },
  contactPhone: { type: String },
  notes: { type: String },
  // Additional fields we store when created from advertised project
  projectTitle: { type: String },
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
  // Flags
  isConverted: { type: Boolean, default: false },
  isConvertedToTender: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure at least one of projectId or advertisedProjectId is present
BidSchema.pre('validate', function(next) {
  if (!this.projectId && !this.advertisedProjectId) {
    next(new Error('Either projectId or advertisedProjectId must be provided.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Bid', BidSchema);