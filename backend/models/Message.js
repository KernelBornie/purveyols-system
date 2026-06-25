const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'audio', 'video', 'document'], required: true },
  url: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number },
});

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, default: '' },
  content: { type: String, default: '' },
  attachments: [AttachmentSchema], // 👈 NEW
  read: { type: Boolean, default: false },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);