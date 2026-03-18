const mongoose = require('mongoose');

const ProcurementOrderSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: {
      type: String,
      enum: ['pending', 'priced', 'approved', 'funded', 'rejected'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supplier: { type: String },
    deliveryDate: { type: Date },
    rejectionReason: { type: String },
    priceSetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByDirector: { type: Boolean, default: false },
    fundedByAccountant: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ProcurementOrderSchema.pre('save', function (next) {
  if (this.quantity != null && this.unitPrice != null) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  next();
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);
