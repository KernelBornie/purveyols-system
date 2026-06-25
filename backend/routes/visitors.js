// ─── GET all workers ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('enrolledBy', 'name role')
      .populate('project', 'name')
      .populate('verifiedBy', 'name role');
    const enriched = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.find({ worker: worker._id });
      const totalEarned = attendance.reduce((sum, a) => sum + (a.days * a.rate || a.rate), 0);
      const payments = await Payment.find({ worker: worker._id, status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker._doc, totalEarned, totalPaid, balance: totalEarned - totalPaid };
    }));
    res.json(enriched);  // <── use `enriched` or `workers` – both are defined
  } catch (err) { res.status(500).json({ error: err.message }); }
});