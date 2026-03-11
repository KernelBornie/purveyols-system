require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purveyols';

const seedUsers = [
  { name: 'James Director', email: 'director@purveyols.com', password: 'password123', role: 'director', phone: '0977000001' },
  { name: 'Mary Accountant', email: 'accountant@purveyols.com', password: 'password123', role: 'accountant', phone: '0977000002' },
  { name: 'John Engineer', email: 'engineer@purveyols.com', password: 'password123', role: 'engineer', phone: '0977000003' },
  { name: 'Peter Foreman', email: 'foreman@purveyols.com', password: 'password123', role: 'foreman', phone: '0977000004' },
  { name: 'David Driver', email: 'driver@purveyols.com', password: 'password123', role: 'driver', phone: '0977000005' },
  { name: 'Grace Procurement', email: 'procurement@purveyols.com', password: 'password123', role: 'procurement', phone: '0977000006' },
  { name: 'Sarah Safety', email: 'safety@purveyols.com', password: 'password123', role: 'safety', phone: '0977000007' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const userData of seedUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      await User.create(userData);
      console.log(`Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
