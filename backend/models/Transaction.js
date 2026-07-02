const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  amount: Number,
  currency: String,
  module: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'pending' },
  initiatedBy: mongoose.Schema.Types.ObjectId,
  approvedBy: mongoose.Schema.Types.ObjectId,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: Date
});
transactionSchema.index({ module: 1, relatedId: 1 }, { unique: true });
module.exports = mongoose.model('Transaction', transactionSchema);
