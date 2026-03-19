const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number },
    totalPrice: { type: Number }
  },
  { _id: false }
);

const ProcurementOrderSchema = new mongoose.Schema(
  {
    items: { type: [ItemSchema], required: true },
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
    fundedByAccountant: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ProcurementOrderSchema.pre('save', function (next) {
  let orderTotal = 0;
  let allPriced = true;
  for (const item of this.items) {
    if (item.quantity != null && item.unitPrice != null) {
      item.totalPrice = item.quantity * item.unitPrice;
      orderTotal += item.totalPrice;
    } else {
      allPriced = false;
    }
  }
  if (allPriced && this.items.length > 0) {
    this.totalPrice = orderTotal;
  }
  next();
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);
