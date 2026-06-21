const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['user', 'ai', 'general', 'project', 'worker', 'funding', 'payment', 'procurement', 'boq', 'subcontract', 'stats', 'error'], default: 'general' },
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ChatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
