const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nrc: { type: String, required: true, unique: true },
    phone: { type: String },
    dailyRate: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0, min: 0 },
    site: { type: String },
    mobileNetwork: { type: String, enum: ['airtel', 'mtn', 'other'], default: 'airtel' },
    role: {
      type: String,
      enum: ['worker', 'driver', 'foreman', 'engineer', 'other'],
      default: 'worker'
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

WorkerSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

module.exports = mongoose.model('Worker', WorkerSchema);
