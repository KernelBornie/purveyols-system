const mongoose = require('mongoose');

const BOQItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitRate: { type: Number, required: true, min: 0 },
  amount: { type: Number },
});

BOQItemSchema.pre('save', function (next) {
  this.amount = this.quantity * this.unitRate;
  next();
});

const BOQSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    site: { type: String, trim: true },
    items: [BOQItemSchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'shared'],
      default: 'draft',
    },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

BOQSchema.pre('save', function (next) {
  this.totalAmount = (this.items || []).reduce((sum, item) => {
    item.amount = item.quantity * item.unitRate;
    return sum + (item.amount || 0);
  }, 0);
  next();
});

module.exports = mongoose.model('BOQ', BOQSchema);
