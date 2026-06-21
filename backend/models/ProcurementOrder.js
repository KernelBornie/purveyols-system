const mongoose = require('mongoose');
const ProcurementOrderSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    supplier: String,
    notes: String,
  }],
  status: { type: String, enum: ['draft','pending','funded','purchased','rejected'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fundedAt: Date,
  procurementOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);
