const mongoose = require('mongoose');

const AdvertisedProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
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
    enum: ['open', 'closed', 'bidded'],
    default: 'open'
  },
  uniqueKey: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AdvertisedProjectSchema.pre('save', function(next) {
  if (!this.uniqueKey) {
    const key = `${this.title}-${this.sourceUrl || this.id}`.replace(/\s/g, '_').toLowerCase();
    this.uniqueKey = key;
  }
  next();
});

module.exports = mongoose.model('AdvertisedProject', AdvertisedProjectSchema);