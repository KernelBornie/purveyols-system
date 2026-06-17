const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['director','civil-engineer','quantity-surveyor','accountant','procurement-officer','safety-officer','driver','foreman','receptionist','admin'],
    required: true,
  },
  phone: { type: String, default: '' },
  nrc: { type: String, default: '' },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('User', UserSchema);
