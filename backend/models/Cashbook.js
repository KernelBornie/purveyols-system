const mongoose = require('mongoose');
const cashbookSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactions: [{
    transactionId: String,
    amount: Number,
    type: { type: String, enum: ['debit', 'credit'] },
    description: String,
    timestamp: Date,
    relatedModule: String,
    relatedId: mongoose.Schema.Types.ObjectId
  }]
});
module.exports = mongoose.model('Cashbook', cashbookSchema);
