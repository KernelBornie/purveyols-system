const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'worker_enrolled',
      'boq_shared',
      'payment_made',
      'payment_confirmed',
      'payment_failed',
      'funding_requested',
      'funding_approved',
      'funding_rejected',
      'funding_funded',
      'funding_forwarded', // 👈 NEW
      'procurement_ordered',
      'procurement_funded',
      'procurement_approved',
      'procurement_rejected',
      'subcontract_created',
      'subcontract_approved',
      'subcontract_funded',
      'worker_checked_in',
      'message_received',
      'project_approved',
      'project_rejected',
      'project_created',
      'safety_report_created',
      'visitor_logged',
      'logbook_entry',
      'spare_part_requested',
      'spare_part_approved',
      'spare_part_rejected',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);