const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const projectRoutes = require("./src/routes/projects");

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

/* Health route */
app.get("/", (req, res) => {
  res.send("PURVEYOLS CMS API is running");
});

/* API routes */
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

/* MongoDB connection */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

/* Server start */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});