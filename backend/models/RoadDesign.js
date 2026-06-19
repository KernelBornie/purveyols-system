const mongoose = require('mongoose');

const RoadDesignSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  alignment: [{ x: Number, y: Number }],
  chainages: [Number],
  crossSections: [{ chainage: Number, width: Number, slope: Number }],
  profile: [{ chainage: Number, elevation: Number }],
  drainage: [{ type: String, size: Number, length: Number }],
  culverts: [{ size: Number, length: Number, location: [Number] }],
  earthworks: { cutVolume: Number, fillVolume: Number },
  subbaseQuantity: Number,
  baseCourseQuantity: Number,
  asphaltQuantity: Number,
  boq: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RoadDesign', RoadDesignSchema);
