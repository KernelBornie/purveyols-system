const mongoose = require('mongoose');

const ProcurementOrderSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  items: [{
    description: String,
    unit: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    supplier: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'procurement_approved', 'approved', 'rejected', 'funded', 'purchased', 'delivered'],
    default: 'pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fundedAt: Date,
  procurementOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: String,
  grandTotal: Number,
  preparedBy: String,
  approvedBy: String,
  authorisedBy: String,
  preparedSign: String,
  approvedSign: String,
  authorisedSign: String,
  supplier: String,
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);