const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const projectRoutes = require("./src/routes/projects");
const workerRoutes = require("./src/routes/workers");
const fundingRequestRoutes = require("./src/routes/fundingRequests");
const materialRequestRoutes = require("./src/routes/materialRequests");
const paymentRoutes = require("./src/routes/payments");
const logbookRoutes = require("./src/routes/logbooks");
const safetyReportRoutes = require("./src/routes/safetyReports");
const reportRoutes = require("./src/routes/reports");

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
app.use("/api/workers", workerRoutes);
app.use("/api/funding-requests", fundingRequestRoutes);
app.use("/api/material-requests", materialRequestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/logbooks", logbookRoutes);
app.use("/api/safety-reports", safetyReportRoutes);
app.use("/api/reports", reportRoutes);

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