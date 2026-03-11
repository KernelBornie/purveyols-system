const mongoose = require('mongoose');

const ProcurementOrderSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'delivered'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supplier: { type: String },
    deliveryDate: { type: Date },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

ProcurementOrderSchema.pre('save', function (next) {
  this.totalPrice = this.quantity * this.unitPrice;
  next();
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);
