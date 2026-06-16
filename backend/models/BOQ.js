const mongoose = require('mongoose');
const BOQSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  items: [{
    description: String,
    quantity: Number,
    unit: String,
    rate: Number,
    amount: Number,
    notes: String,
  }],
  status: { type: String, enum: ['draft','submitted','approved'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});
module.exports = mongoose.model('BOQ', BOQSchema);
