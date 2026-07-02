const mongoose = require('mongoose');
const ledgerSchema = new mongoose.Schema({
  account: String,
  transactionId: String,
  amount: Number,
  type: { type: String, enum: ['debit', 'credit'] },
  description: String,
  module: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  timestamp: Date
});
module.exports = mongoose.model('Ledger', ledgerSchema);
