const mongoose = require('mongoose');

const BOQItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
  boq: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ' },
});

module.exports = mongoose.model('BOQItem', BOQItemSchema);
