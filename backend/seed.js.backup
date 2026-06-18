const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Worker = require('./models/Worker');
const FundingRequest = require('./models/FundingRequest');
const Payment = require('./models/Payment');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany();
  await Project.deleteMany();
  await Worker.deleteMany();
  await FundingRequest.deleteMany();
  await Payment.deleteMany();

  const hash = await bcrypt.hash('123456', 10);
  const users = await User.insertMany([
    { name: 'Director', email: 'director@example.com', role: 'director', password: hash },
    { name: 'Civil Engineer', email: 'engineer@example.com', role: 'civil-engineer', password: hash },
    { name: 'Quantity Surveyor', email: 'qs@example.com', role: 'quantity-surveyor', password: hash },
    { name: 'Accountant', email: 'accountant@example.com', role: 'accountant', password: hash, mobileMoneyNumber: '0971234567' },
    { name: 'Procurement Officer', email: 'procurement@example.com', role: 'procurement-officer', password: hash },
    { name: 'Safety Officer', email: 'safety@example.com', role: 'safety-officer', password: hash },
    { name: 'Driver', email: 'driver@example.com', role: 'driver', password: hash },
    { name: 'Foreman', email: 'foreman@example.com', role: 'foreman', password: hash },
    { name: 'Receptionist', email: 'reception@example.com', role: 'receptionist', password: hash },
  ]);

  const engineer = users[1];
  const accountant = users[3];

  const project = await Project.create({
    name: 'Demo Housing Project',
    location: 'Lusaka',
    startDate: new Date(),
    status: 'active',
    budget: 500000,
    manager: engineer._id,
    createdBy: engineer._id,
    description: 'Affordable housing units',
  });

  // Ensure unique NRCs
  const workers = await Worker.insertMany([
    {
      name: 'John Mwansa',
      nrc: '123456/78/1',
      phone: '+260971234567',
      dailyRate: 150,
      site: 'Lusaka Site A',
      enrolledBy: engineer._id,
      status: 'active',
    },
    {
      name: 'Mary Banda',
      nrc: '234567/89/2',
      phone: '+260972345678',
      dailyRate: 180,
      site: 'Lusaka Site B',
      enrolledBy: engineer._id,
      status: 'active',
    },
    {
      name: 'Bornface Kangombe',
      nrc: '131213/18/1',
      phone: '+260974674713',
      dailyRate: 200,
      site: 'UTH',
      enrolledBy: engineer._id,
      status: 'active',
    },
  ]);

  await FundingRequest.create({
    project: project._id,
    amount: 25000,
    description: 'Request for additional materials',
    status: 'pending',
    requestedBy: engineer._id,
  });

  console.log('✅ Database seeded with project, workers, and funding request!');
  console.log('   Accountant mobile money number set to: 0971234567');
  process.exit();
};
seed();
