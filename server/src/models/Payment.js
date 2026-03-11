const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    amount: { type: Number, required: true, min: 0 },
    days: { type: Number, required: true, min: 1 },
    mobileNetwork: { type: String, required: true, enum: ['airtel', 'mtn'] },
    phoneNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    transactionRef: { type: String, trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    site: { type: String, trim: true },
    paymentPeriodStart: { type: Date },
    paymentPeriodEnd: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ worker: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
