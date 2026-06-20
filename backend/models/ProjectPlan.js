const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed', 'delayed'], default: 'not-started' },
});

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dueDate: { type: Date, required: true },
  achievedDate: Date,
  status: { type: String, enum: ['pending', 'achieved', 'missed'], default: 'pending' },
});

const ProjectPlanSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  tasks: [TaskSchema],
  milestones: [MilestoneSchema],
  baselineStart: Date,
  baselineEnd: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectPlan', ProjectPlanSchema);