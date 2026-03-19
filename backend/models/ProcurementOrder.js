const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number } // ✅ computed
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
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    totalPrice: { type: Number } // ✅ order total
  },
  { timestamps: true }
);


// 🔥 CRITICAL BUSINESS LOGIC (RESTORE THIS)
ProcurementOrderSchema.pre('save', function (next) {
  let orderTotal = 0;
  let allPriced = true;

  for (const item of this.items) {
    if (item.quantity != null && item.unitPrice != null) {
      item.totalPrice = item.quantity * item.unitPrice;
      orderTotal += item.totalPrice;
    } else {
      item.totalPrice = undefined;
      allPriced = false;
    }
  }

  if (allPriced && this.items.length > 0) {
    this.totalPrice = orderTotal;
  } else {
    this.totalPrice = undefined;
  }

  next();
});

module.exports = mongoose.model('ProcurementOrder', ProcurementOrderSchema);