const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true },
    estimatedCost: { type: Number, min: 0 },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    site: { type: String, required: true, trim: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'ordered', 'delivered', 'cancelled'],
      default: 'pending',
    },
    supplier: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

materialRequestSchema.index({ requestedBy: 1, status: 1 });
materialRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
