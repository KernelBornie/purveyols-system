const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'worker_enrolled',
      'boq_shared',
      'payment_made',
      'funding_requested',
      'funding_approved',
      'procurement_ordered',
      'procurement_funded',
      'subcontract_created',
      'worker_checked_in',
      'message_received',
      'project_approved',
      'project_rejected',
      'procurement_approved',
      'procurement_rejected',
      'payment_initiated',
      'payment_received',
      'payment_failed',
      'payment_confirmed'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed } // extra context
});

module.exports = mongoose.model('Notification', NotificationSchema);
