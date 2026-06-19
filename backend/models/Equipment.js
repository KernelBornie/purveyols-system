const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['Total Station', 'GPS Rover', 'Drone', 'Laser Level', 'Dumpy Level', 'Theodolite', 'Survey Tripod'],
    required: true,
  },
  serialNumber: { type: String, unique: true },
  purchaseDate: Date,
  condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor'], default: 'Good' },
  assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
