const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['worker', 'subcontract', 'machinery'],
    required: true,
  },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  reference: { type: String, unique: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paidAt: { type: Date, default: Date.now },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  subcontract: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcontract' },
  notes: String,
});

module.exports = mongoose.model('Payment', PaymentSchema);
