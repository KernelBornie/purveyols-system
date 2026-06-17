const mongoose = require('mongoose');
const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nrc: { type: String, unique: true, required: true },
  phone: String,
  dailyRate: Number,
  site: String,
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
});
module.exports = mongoose.model('Worker', WorkerSchema);
