const Settings = require('../models/Settings');
const path = require('path');

// Get settings (public)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    } else {
      let updated = false;
      if (!settings.shopName || settings.shopName === 'Mobile Hub' || settings.shopName === 'SR Mobile Official' || settings.shopName === 'Max Durakathana' || settings.shopName === 'SR Mobile') {
        settings.shopName = 'Mobixa';
        updated = true;
      }
      if (settings.receiptSettings?.headerTitle === 'Mobile Hub' || settings.receiptSettings?.headerTitle === 'SR Mobile Official' || settings.receiptSettings?.headerTitle === 'Max Durakathana' || settings.receiptSettings?.headerTitle === 'SR Mobile') {
        settings.receiptSettings.headerTitle = 'Mobixa';
        updated = true;
      }
      if (updated) {
        await settings.save();
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update settings (admin only)
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    const fields = [
      'shopName', 'tagline', 'email', 'phone', 'phone2', 'address', 'city', 'country',
      'currency', 'exchangeRate', 'deliveryFeeThreshold', 'deliveryFee', 'taxRate',
      'loyaltyPointsPerUnit', 'loyaltyPointValue', 'footerText', 'maintenanceMode',
      'logoUrl', 'logo', 'sealUrl', 'seal', 'letterheadHeader', 'letterheadFooter', 'labelPrinters',
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // Social links
    if (req.body.socialLinks) {
      settings.socialLinks = { ...settings.socialLinks.toObject?.() || {}, ...req.body.socialLinks };
    }

    // Role permissions
    if (req.body.rolePermissions) {
      settings.rolePermissions = req.body.rolePermissions;
    }

    // Hero products
    if (req.body.heroProducts) {
      settings.heroProducts = req.body.heroProducts;
    }
    
    // Receipt settings
    if (req.body.receiptSettings) {
      settings.receiptSettings = req.body.receiptSettings;
    }

    if (req.body.documentTemplates) {
      settings.documentTemplates = req.body.documentTemplates;
    }

    if (req.body.smsTemplates) {
      settings.smsTemplates = req.body.smsTemplates;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    let logoPath;
    if (req.file.buffer) {
      // Memory storage (serverless/Vercel)
      logoPath = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.file.filename) {
      // Disk storage
      logoPath = `/uploads/${req.file.filename}`;
    } else {
      logoPath = `/uploads/${Date.now()}-${req.file.originalname}`;
    }

    settings.logo = logoPath;
    settings.logoUrl = logoPath;
    await settings.save();

    res.json({ logo: logoPath, logoUrl: logoPath, message: 'Logo updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSettings, updateSettings, uploadLogo };
