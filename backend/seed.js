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
  
  // All users with password '123456'
  const users = await User.insertMany([
    // Original users
    { name: 'Director', email: 'director@example.com', role: 'director', password: hash },
    { name: 'Civil Engineer', email: 'engineer@example.com', role: 'civil-engineer', password: hash },
    { name: 'Quantity Surveyor', email: 'qs@example.com', role: 'quantity-surveyor', password: hash },
    { name: 'Accountant', email: 'accountant@example.com', role: 'accountant', password: hash, mobileMoneyNumber: '0971234567' },
    { name: 'Procurement Officer', email: 'procurement@example.com', role: 'procurement-officer', password: hash },
    { name: 'Safety Officer', email: 'safety@example.com', role: 'safety-officer', password: hash },
    { name: 'Driver', email: 'driver@example.com', role: 'driver', password: hash },
    { name: 'Foreman', email: 'foreman@example.com', role: 'foreman', password: hash },
    { name: 'Receptionist', email: 'reception@example.com', role: 'receptionist', password: hash },
    
    // Additional Engineers
    { name: 'Engineer 1', email: 'engineer1@example.com', role: 'civil-engineer', password: hash },
    { name: 'Engineer 2', email: 'engineer2@example.com', role: 'civil-engineer', password: hash },
    { name: 'Engineer 3', email: 'engineer3@example.com', role: 'civil-engineer', password: hash },
    { name: 'Engineer 4', email: 'engineer4@example.com', role: 'civil-engineer', password: hash },
    { name: 'Engineer 5', email: 'engineer5@example.com', role: 'civil-engineer', password: hash },
    
    // Additional Foremen
    { name: 'Foreman 1', email: 'foreman1@example.com', role: 'foreman', password: hash },
    { name: 'Foreman 2', email: 'foreman2@example.com', role: 'foreman', password: hash },
    { name: 'Foreman 3', email: 'foreman3@example.com', role: 'foreman', password: hash },
    { name: 'Foreman 4', email: 'foreman4@example.com', role: 'foreman', password: hash },
    { name: 'Foreman 5', email: 'foreman5@example.com', role: 'foreman', password: hash },
    
    // Additional Drivers
    { name: 'Driver 1', email: 'driver1@example.com', role: 'driver', password: hash },
    { name: 'Driver 2', email: 'driver2@example.com', role: 'driver', password: hash },
    { name: 'Driver 3', email: 'driver3@example.com', role: 'driver', password: hash },
    { name: 'Driver 4', email: 'driver4@example.com', role: 'driver', password: hash },
    { name: 'Driver 5', email: 'driver5@example.com', role: 'driver', password: hash },
    { name: 'Driver 6', email: 'driver6@example.com', role: 'driver', password: hash },
    { name: 'Driver 7', email: 'driver7@example.com', role: 'driver', password: hash },
    { name: 'Driver 8', email: 'driver8@example.com', role: 'driver', password: hash },
    { name: 'Driver 9', email: 'driver9@example.com', role: 'driver', password: hash },
    { name: 'Driver 10', email: 'driver10@example.com', role: 'driver', password: hash },
  ]);

  // Set reportsTo for all users to director
  const director = users.find(u => u.role === 'director');
  if (director) {
    await User.updateMany({ _id: { $ne: director._id } }, { reportsTo: director._id });
  }

  // Create a demo project
  const engineer = users.find(u => u.email === 'engineer@example.com');
  if (engineer) {
    await Project.create({
      name: 'Demo Housing Project',
      location: 'Lusaka',
      startDate: new Date(),
      status: 'active',
      budget: 500000,
      manager: engineer._id,
      createdBy: engineer._id,
      description: 'Affordable housing units',
    });
  }

  // Enroll some workers
  if (engineer) {
    await Worker.insertMany([
      {
        name: 'Kenny Brown',
        nrc: '131213/11/1',
        phone: '+260974674713',
        dailyRate: 150,
        site: 'UTH',
        enrolledBy: engineer._id,
        status: 'active',
      },
      {
        name: 'Peter Chanda',
        nrc: '131313/32/1',
        phone: '+260978654785',
        dailyRate: 180,
        site: 'ABSA',
        enrolledBy: engineer._id,
        status: 'active',
      },
      {
        name: 'Bornface Kangombe',
        nrc: '131213/18/1',
        phone: '+260974674713',
        dailyRate: 80,
        site: 'UTH',
        enrolledBy: engineer._id,
        status: 'active',
      },
    ]);
  }

  // Create a funding request
  if (engineer) {
    const project = await Project.findOne({ name: 'Demo Housing Project' });
    if (project) {
      await FundingRequest.create({
        project: project._id,
        amount: 25000,
        description: 'Request for additional materials',
        status: 'pending',
        requestedBy: engineer._id,
      });
    }
  }

  console.log('✅ Database seeded!');
  console.log(`   Total users: ${users.length}`);
  console.log('   Password for all users: 123456');
  process.exit();
};
seed();
