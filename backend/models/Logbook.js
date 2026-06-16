const mongoose = require('mongoose');

const LogbookSchema = new mongoose.Schema({
  vehicle: { type: String, required: true },
  route: { type: String, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  distance: { type: Number },
  fuelUsed: { type: Number },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  fileData: { type: String }, // base64 encoded
  fileName: { type: String },
  fileType: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Logbook', LogbookSchema);
