const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24h expiry
});

module.exports = mongoose.model('Meeting', MeetingSchema);