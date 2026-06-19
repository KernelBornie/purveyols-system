const mongoose = require('mongoose');

const AccessControlLayoutSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  elements: [{
    type: {
      type: String,
      enum: ['gate', 'barrier', 'turnstile', 'biometric', 'card_reader', 'guard_house', 'cctv', 'alarm', 'security_light'],
    },
    x: Number,
    y: Number,
    orientation: Number,
    details: Object,
  }],
  boq: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AccessControlLayout', AccessControlLayoutSchema);
