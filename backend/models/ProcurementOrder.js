const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true },
    unitPrice: { type: Number, min: 0 },
    totalPrice: { type: Number, min: 0 }
  },
  { _id: false }
);

const ProcurementOrderSchema = new mongoose.Schema(
  {
    items: {
      type: [ItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'At least one item is required'
      }
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    deliveryDate: { type: Date },
    supplier: { type: String, trim: true },
    totalPrice: { type: Number, min: 0 },
    priceSetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByDirector: { type: Boolean, default: false },
    fundedByAccountant: { type: Boolean, default: false },
    rejectionReason: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'priced', 'approved', 'funded', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

ProcurementOrderSchema.pre('save', function (next) {
  let orderTotal = 0;
  let hasAllItemPrices = true;

  this.items = this.items.map((item) => {
    if (item.unitPrice == null) {
      hasAllItemPrices = false;
      return { ...item.toObject(), totalPrice: undefined };
    }

    const itemTotal = Number(item.quantity) * Number(item.unitPrice);
    orderTotal += itemTotal;
    return { ...item.toObject(), totalPrice: itemTotal };
  });

  this.totalPrice = hasAllItemPrices ? orderTotal : undefined;
  next();
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);
