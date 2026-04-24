const mongoose = require('mongoose');

const CoordinateSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  altitude: { type: Number },
  accuracy: { type: Number },
  capturedAt: { type: Date, default: Date.now },
  capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const SiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    projectName: { type: String, trim: true },
    description: { type: String, trim: true },
    coordinates: [CoordinateSchema],
    primaryCoordinate: {
      lat: { type: Number },
      lng: { type: Number },
    },
    terrain: {
      type: String,
      enum: ['flat', 'sloped', 'hilly', 'mountainous'],
      default: 'flat',
    },
    accessibility: {
      type: String,
      enum: ['urban', 'suburban', 'rural', 'remote'],
      default: 'urban',
    },
    siteType: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'infrastructure', 'road', 'bridge', 'other'],
      default: 'residential',
    },
    area: { type: Number, default: 0 },
    areaUnit: { type: String, default: 'm²' },
    status: {
      type: String,
      enum: ['active', 'surveyed', 'planned', 'completed'],
      default: 'planned',
    },
    lastAIAnalysis: {
      analyzedAt: { type: Date },
      riskScore: { type: Number },
      riskLevel: { type: String },
      confidence: { type: Number },
      costEstimate: { type: Number },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Site', SiteSchema);
