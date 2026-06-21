const mongoose = require('mongoose');

const MaterialRequestItemSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  unit: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
});

const MaterialRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  items: [MaterialRequestItemSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'funded', 'purchased', 'delivered'],
    default: 'pending'
  },
  grandTotal: { type: Number, default: 0 },
  requisitionNumber: { type: String, unique: true },
  preparedBy: { type: String, default: '' },
  approvedBy: { type: String, default: '' },
  authorisedBy: { type: String, default: '' },
  preparedSign: { type: String, default: '' },
  approvedSign: { type: String, default: '' },
  authorisedSign: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-generate requisition number if not provided
MaterialRequestSchema.pre('save', function(next) {
  if (!this.requisitionNumber) {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.requisitionNumber = `${y}${m}${d}-${rand}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MaterialRequest', MaterialRequestSchema);
