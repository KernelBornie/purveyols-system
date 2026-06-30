const mongoose = require('mongoose');

const BOQItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
});

const BOQSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  items: [BOQItemSchema],
  order: { type: Number, default: 0 },
});

// ─── Document schema ──────────────────────────────────────────────
const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String },
  url: { type: String },
  mimeType: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const BOQSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  sections: [BOQSectionSchema],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'issued'],
    default: 'draft',
  },
  subTotal: { type: Number, default: 0 },
  percentageAdjustment: { type: Number, default: 0 },
  contingencies: { type: Number, default: 0 },
  vat: { type: Number, default: 16 },
  grandTotal: { type: Number, default: 0 },
  clientName: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  projectLocation: { type: String, default: '' },
  tendererName: { type: String, default: '' },
  tendererAddress: { type: String, default: '' },
  tenderDate: { type: Date, default: Date.now },
  exchangeRate: { type: Number, default: 1 },
  templateName: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  documents: [DocumentSchema],   // ✅ New field
});

module.exports = mongoose.model('BOQ', BOQSchema);