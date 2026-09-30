const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @desc    Get current user's checkout profile
// @route   GET /api/me/checkout-profile
// @access  Private (401 for guests)
router.get('/checkout-profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name email phone addresses');
    if (!user) {
      res.status(401);
      return next(new Error('User not found'));
    }

    const addresses = (user.addresses || []).map((addr) => ({
      id: addr._id,
      _id: addr._id,
      label: addr.label || 'Home',
      line1: addr.line1 || addr.street || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      district: addr.district || addr.state || '',
      isDefault: !!addr.isDefault,
    }));

    // Sort default address first
    addresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.json({
      fullName: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      addresses,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Save a new address to user profile
// @route   POST /api/me/addresses
// @access  Private
router.post('/addresses', protect, async (req, res, next) => {
  try {
    const { label, line1, line2, city, district, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: label || 'Home',
      street: line1,
      line1,
      line2: line2 || '',
      city,
      district,
      state: district,
      isDefault: !!isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses[user.addresses.length - 1]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
