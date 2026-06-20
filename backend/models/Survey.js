const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  surveyNumber: { type: String, required: true, unique: true },
  surveyDate: { type: Date, default: Date.now },
  surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  equipmentUsed: [{
    type: String,
    enum: ['Total Station', 'RTK GPS', 'Drone', 'Automatic Level'],
  }],
  boundaryCoordinates: [{
    northing: Number,
    easting: Number,
    elevation: Number,
  }],
  contours: [{
    elevation: Number,
    points: [[Number]], // array of [x,y] pairs
  }],
  area: { type: Number, default: 0 },
  perimeter: { type: Number, default: 0 },
  fileUrls: [String],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  // Cut/fill results
  cutVolume: { type: Number, default: 0 },
  fillVolume: { type: Number, default: 0 },
  netVolume: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Survey', SurveySchema);