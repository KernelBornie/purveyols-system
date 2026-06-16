const mongoose = require('mongoose');
const SubcontractSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  vendor: String,
  service: String,
  amount: Number,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active','completed','terminated'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Subcontract', SubcontractSchema);
