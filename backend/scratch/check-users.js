const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    const users = await User.find({}).select('name email role isActive');
    console.log('=== DATABASE USERS ===');
    users.forEach(u => {
      console.log(`- Name: ${u.name} | Email: "${u.email}" | Role: ${u.role} | Active: ${u.isActive}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
