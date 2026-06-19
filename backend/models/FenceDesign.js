const mongoose = require('mongoose');

const FenceDesignSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  length: { type: Number, required: true },
  fenceType: {
    type: String,
    enum: ['Chain Link', 'Palisade', 'Palace', 'Electric'],
    required: true,
  },
  postSpacing: { type: Number, default: 3 },
  numberOfGates: { type: Number, default: 0 },
  // Computed automatically
  numberOfPosts: Number,
  wireLength: Number,
  razorWireLength: Number,
  concreteVolume: Number,
  cementBags: Number,
  boq: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FenceDesign', FenceDesignSchema);
