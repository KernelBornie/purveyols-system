const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  idNumber: { type: String },
  company: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  purpose: { type: String },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ['inside', 'departed'],
    default: 'inside'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Visitor', VisitorSchema);