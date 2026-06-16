const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
require('dotenv').config();

const seedNotifications = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Notification.deleteMany();
  const accountant = await User.findOne({ email: 'accountant@example.com' });
  if (accountant) {
    await Notification.create([
      {
        user: accountant._id,
        type: 'worker_enrolled',
        title: 'Welcome to Purveyols!',
        message: 'This is a test notification to show the system is working.',
        link: '/workers',
        read: false,
      },
      {
        user: accountant._id,
        type: 'funding_requested',
        title: 'Sample Notification',
        message: 'You will receive notifications for worker enrollments, payments, and more.',
        link: '/funding',
        read: false,
      }
    ]);
    console.log('✅ Test notifications created for accountant.');
  } else {
    console.log('⚠️ Accountant not found – seed users first.');
  }
  process.exit();
};
seedNotifications();
