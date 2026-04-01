const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');

// POST /api/attendance/mark – mark or update a worker's attendance for a given date
router.post('/mark', auth, async (req, res) => {
  try {
    const { workerId, date, status, overtimeHours, overtimeRate } = req.body;

    if (!workerId || !date || !status) {
      return res.status(400).json({ message: 'workerId, date, and status are required' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'status must be "present" or "absent"' });
    }

    if (overtimeRate !== undefined && (!Number.isFinite(overtimeRate) || overtimeRate < 0)) {
      return res.status(400).json({ message: 'overtimeRate must be a non-negative number' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    // Normalize date to midnight UTC so one record per calendar day
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { worker: workerId, date: attendanceDate },
      {
        worker: workerId,
        date: attendanceDate,
        status,
        overtimeHours: overtimeHours || 0,
        overtimeRate: overtimeRate !== undefined ? overtimeRate : (worker.overtimeRate || 0),
        markedBy: req.user._id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('worker', 'name nrc dailyRate')
      .populate('markedBy', 'name email');

    res.status(201).json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/worker/:id – get all attendance records for a specific worker
router.get('/worker/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const records = await Attendance.find({ worker: req.params.id })
      .sort({ date: -1 })
      .populate('worker', 'name nrc dailyRate')
      .populate('markedBy', 'name email');

    res.json({ attendance: records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
