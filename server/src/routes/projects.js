const express = require("express");
const { body, validationResult } = require("express-validator");
const Project = require("../models/Project");
const { authenticate, authorize } = require("../middleware/auth");
const { generalLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/projects - list all projects
router.get(
  "/",
  generalLimiter,
  authenticate,
  authorize("director", "accountant", "engineer", "foreman", "procurement", "safety"),
  async (req, res) => {
    try {
      const projects = await Project.find().sort({ createdAt: -1 });
      res.json({ projects });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/projects - create a project
router.post(
  "/",
  generalLimiter,
  authenticate,
  authorize("director", "engineer"),
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("status")
      .optional()
      .isIn(["planning", "active", "completed"])
      .withMessage("Invalid status"),
    body("budget").optional().isNumeric().withMessage("Budget must be numeric"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, location, budget, status, startDate, endDate } = req.body;
      const project = await Project.create({ name, location, budget, status, startDate, endDate });
      res.status(201).json({ project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/projects/:id - update a project
router.put(
  "/:id",
  generalLimiter,
  authenticate,
  authorize("director", "engineer"),
  [
    body("name").optional().trim().notEmpty().withMessage("Project name cannot be empty"),
    body("status")
      .optional()
      .isIn(["planning", "active", "completed"])
      .withMessage("Invalid status"),
    body("budget").optional().isNumeric().withMessage("Budget must be numeric"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, location, budget, status, startDate, endDate } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (location !== undefined) updates.location = location;
      if (budget !== undefined) updates.budget = budget;
      if (status !== undefined) updates.status = status;
      if (startDate !== undefined) updates.startDate = startDate;
      if (endDate !== undefined) updates.endDate = endDate;
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json({ project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/projects/:id
router.delete(
  "/:id",
  generalLimiter,
  authenticate,
  authorize("director"),
  async (req, res) => {
    try {
      const project = await Project.findByIdAndDelete(req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json({ message: "Project deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;