const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;

// The server continues to start after this call returns. API routes are
// protected by a 503 middleware in app.js until the DB is fully connected.
const connectDB = async () => {
  const attemptConnect = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      console.error(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(attemptConnect, RETRY_DELAY_MS);
    }
  };

  await attemptConnect();
};

module.exports = connectDB;
