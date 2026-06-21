const mongoose = require('mongoose');

const DeliveryItemSchema = new mongoose.Schema(
  {
    quantity: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const DeliverySchema = new mongoose.Schema({
  ms: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  items: { type: [DeliveryItemSchema], default: [] },
  deliveredBy: { type: String, default: '' },
  receivedBy: { type: String, default: '' },
  noteNumber: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Delivery', DeliverySchema);
