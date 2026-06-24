// backend/utils/notificationHelper.js

const formatRole = (role) => {
  const map = {
    'admin': 'Admin',
    'director': 'Director',
    'accountant': 'Accountant',
    'civil-engineer': 'Civil Engineer',
    'quantity-surveyor': 'Quantity Surveyor',
    'procurement-officer': 'Procurement Officer',
    'foreman': 'Foreman',
    'driver': 'Driver',
    'safety-officer': 'Safety Officer',
    'qs': 'Quantity Surveyor',
    'receptionist': 'Receptionist',
  };
  return map[role] || role;
};

// ... your other exports (createNotification, getSenderName, etc.)
module.exports = {
  createNotification,
  getSenderName,
  getSenderRole,
  formatRole,  // 👈 add this
  // ... others
};