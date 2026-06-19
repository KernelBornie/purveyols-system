const mongoose = require('mongoose');

const DrawingSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['site_plan', 'building_plan', 'floor_plan', 'foundation_plan', 'fence_plan', 'road_design', 'drainage', 'access_control', 'electrical', 'water_reticulation', 'topographic'],
    required: true,
  },
  drawingFileUrl: String, // uploaded PDF/DWG/DXF
  previewImage: String,   // base64 PNG thumbnail from canvas
  revisionNumber: { type: Number, default: 1 },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'checked', 'approved', 'issued', 'as_built'],
    default: 'draft',
  },
  canvasData: { type: String }, // fabric.js JSON
  generatedBOQ: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Drawing', DrawingSchema);
