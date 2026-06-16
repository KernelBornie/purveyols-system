const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  purpose: { type: String, required: true },
  host: { type: String },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date },
  notes: String,
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Visitor', VisitorSchema);
