// Creates the first admin account. Run once: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL || 'admin@bookmyfarm.pk';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
  } else {
    await User.create({
      name: 'Platform Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
    });
    console.log('Admin created:', email);
  }
  await mongoose.disconnect();
})();
