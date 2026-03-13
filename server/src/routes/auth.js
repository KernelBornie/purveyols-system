const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

module.exports = router;