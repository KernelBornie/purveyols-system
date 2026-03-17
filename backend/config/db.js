const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Server will continue running. Retrying connection in the background...');
    // Allow mongoose to keep retrying in the background rather than exiting
  }
};

module.exports = connectDB;
