const mongoose = require('mongoose');

const SubcontractSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['personnel', 'machinery'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true }, // e.g. electrician, plumber, crane
    company: { type: String, required: true, trim: true },
    dateHired: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    site: { type: String, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    notes: { type: String, trim: true },
    hiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

SubcontractSchema.index({ hiredBy: 1, status: 1 });
SubcontractSchema.index({ dateHired: -1 });

module.exports = mongoose.model('Subcontract', SubcontractSchema);
