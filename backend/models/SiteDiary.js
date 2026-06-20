const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  siteConditions: { type: String, enum: ['clear', 'rain', 'windy', 'hot', 'cold'], default: 'clear' },
  activities: [{ 
    description: String, 
    labourCount: Number, 
    equipmentUsed: [String] 
  }],
  materialsDelivered: [{ 
    material: String, 
    quantity: Number, 
    unit: String 
  }],
  delays: [String],
  photos: [String], // URLs
  weather: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const SiteDiarySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  entries: [DiaryEntrySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SiteDiary', SiteDiarySchema);