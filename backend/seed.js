const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany();
  await Project.deleteMany();
  const hash = await bcrypt.hash('123456', 10);
  const users = await User.insertMany([
    { name: 'Director', email: 'director@example.com', role: 'director', password: hash },
    { name: 'Civil Engineer', email: 'engineer@example.com', role: 'civil-engineer', password: hash },
    { name: 'Quantity Surveyor', email: 'qs@example.com', role: 'quantity-surveyor', password: hash },
    { name: 'Accountant', email: 'accountant@example.com', role: 'accountant', password: hash },
    { name: 'Procurement Officer', email: 'procurement@example.com', role: 'procurement-officer', password: hash },
    { name: 'Safety Officer', email: 'safety@example.com', role: 'safety-officer', password: hash },
    { name: 'Driver', email: 'driver@example.com', role: 'driver', password: hash },
    { name: 'Foreman', email: 'foreman@example.com', role: 'foreman', password: hash },
    { name: 'Receptionist', email: 'reception@example.com', role: 'receptionist', password: hash },
  ]);
  await Project.create({ name: 'Demo Project', location: 'Lusaka', startDate: new Date(), status: 'active', budget: 100000, manager: users[1]._id });
  console.log('✅ Database seeded!');
  process.exit();
};
seed();
