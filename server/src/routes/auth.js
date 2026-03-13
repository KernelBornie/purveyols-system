const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { generalLimiter, authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* create token */
function createToken(id) {

  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "purveyols-secret",
    { expiresIn: "7d" }
  );

}

/* login */
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = createToken(user._id);

    res.json({
      token,
      user
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});

/* register (admin/director only) */
router.post("/register", generalLimiter, authenticate, async (req, res) => {

  try {

    const { name, email, password, role } = req.body;

    if (!["admin", "director"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only admin or director can register new users" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password, role: role || "engineer" });

    res.status(201).json({ user, message: "User created successfully" });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: "Server error" });

  }

});

/* get current user - used to restore session on refresh */
router.get("/me", generalLimiter, authenticate, async (req, res) => {

  try {

    res.json({ user: req.user });

  } catch (err) {

    res.status(500).json({ message: "Server error" });

  }

});

module.exports = router;