const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentType: { type: String, enum: ['mobile_money', 'bank', 'cash'], required: true },
    recipientName: { type: String, required: true },
    recipientPhone: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'UGX' },
    description: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String },
    paymentDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
