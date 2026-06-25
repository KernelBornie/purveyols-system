// ─── Get BOQ template ──────────────────────────────────────────────
router.get('/templates/:name', auth, async (req, res) => {
  try {
    const templates = require('../data/boqTemplates');
    const template = templates[req.params.name];
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});