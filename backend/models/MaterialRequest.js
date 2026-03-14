const mongoose = require('mongoose');

const MaterialRequestSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'units' },
    site: { type: String, required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: {
      type: String,
      enum: ['pending', 'ordered', 'cancelled', 'delivered'],
      default: 'pending'
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaterialRequest', MaterialRequestSchema);
