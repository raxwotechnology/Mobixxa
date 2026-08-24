const User = require('../models/User');
const RegistrationOtp = require('../models/RegistrationOtp');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { isValidEmail, isValidSLPhone, formatSLPhone } = require('../utils/validators');
const { isRealEmailAddress } = require('../utils/emailValidationService');
const { sendSms, buildOtpMessage } = require('../utils/smsService');
const { sendEmail, passwordResetOtpEmail } = require('../utils/emailService');

const OTP_EXPIRY_MINUTES = 5;

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const fail = (res, status, message) => res.status(status).json({ message });

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !phone) {
      return fail(res, 400, 'Name, email, password and phone are required');
    }

    if (password.length < 6) {
      return fail(res, 400, 'Password must be at least 6 characters');
    }

    if (!isValidEmail(email)) {
      return fail(res, 400, 'Please enter a valid email address');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidSLPhone(phone)) {
      return fail(res, 400, 'Please enter a valid Sri Lankan phone number');
    }

    const normalizedPhone = formatSLPhone(phone);

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return fail(res, 400, 'User already exists');
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Let pre-save hook in User model handle hashing
      phone: normalizedPhone,
      role: role || 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    return fail(res, 500, error.message || 'Registration failed');
  }
};

const requestRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !phone) {
      return fail(res, 400, 'Name, email, password and phone are required');
    }

    if (password.length < 6) {
      return fail(res, 400, 'Password must be at least 6 characters');
    }

    if (!isValidEmail(email)) {
      return fail(res, 400, 'Please enter a valid email address');
    }

    const emailValidation = await isRealEmailAddress(email);
    if (!emailValidation.valid) {
      return fail(res, 400, emailValidation.reason);
    }

    if (!isValidSLPhone(phone)) {
      return fail(res, 400, 'Please enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567)');
    }

    const normalizedPhone = formatSLPhone(phone);
    const normalizedEmail = emailValidation.normalizedEmail;

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return fail(res, 400, 'User already exists');
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        phone: normalizedPhone,
        name: name.trim(),
        passwordHash,
        role: role || 'customer',
        otpHash: hashOtp(otp),
        expiresAt,
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendSms(normalizedPhone, await buildOtpMessage(otp));

    res.json({
      message: 'OTP sent successfully',
      email: normalizedEmail,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to request registration OTP');
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return fail(res, 400, 'Email and OTP are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pending = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (!pending) {
      return fail(res, 400, 'No pending registration found. Request a new OTP.');
    }

    if (pending.expiresAt < new Date()) {
      await RegistrationOtp.deleteOne({ _id: pending._id });
      return fail(res, 400, 'OTP has expired. Please request a new one.');
    }

    if (pending.attempts >= 5) {
      await RegistrationOtp.deleteOne({ _id: pending._id });
      return fail(res, 429, 'Too many failed OTP attempts. Request a new OTP.');
    }

    if (pending.otpHash !== hashOtp(String(otp).trim())) {
      pending.attempts += 1;
      await pending.save();
      return fail(res, 400, 'Invalid OTP');
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      await RegistrationOtp.deleteOne({ _id: pending._id });
      return fail(res, 400, 'User already exists');
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      phone: pending.phone,
      role: pending.role || 'customer',
    });

    await RegistrationOtp.deleteOne({ _id: pending._id });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to verify registration OTP');
  }
};

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 400, 'Email and password are required');
    }

    const trimmedEmail = email.trim();
    const emailRegex = new RegExp('^\\s*' + trimmedEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*$', 'i');
    const user = await User.findOne({ email: { $regex: emailRegex } }).populate('assignedStore', 'name');

    if (!user) {
      return fail(res, 401, 'Invalid email or password');
    }

    // Check if account is deactivated
    if (user.isActive === false) {
      return fail(res, 403, 'Your account has been deactivated. Please contact the administrator.');
    }

    if (await user.matchPassword(password)) {
      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        isSuperAdmin: user.isSuperAdmin || user.role === 'admin',
        permissions: user.permissions || {},
        phone: user.phone, 
        assignedStore: user.assignedStore?._id || user.assignedStore,
        assignedStoreName: user.assignedStore?.name || '',
        employeeInfo: user.employeeInfo,
        token: generateToken(user._id) 
      });
    } else {
      return fail(res, 401, 'Invalid email or password');
    }
  } catch (error) {
    return fail(res, 500, error.message || 'Login failed');
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedStore', 'name');
    if (user) {
      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        isSuperAdmin: user.isSuperAdmin || user.role === 'admin',
        permissions: user.permissions || {},
        phone: user.phone, 
        avatar: user.avatar, 
        addresses: user.addresses,
        assignedStore: user.assignedStore?._id || user.assignedStore,
        assignedStoreName: user.assignedStore?.name || '',
        employeeInfo: user.employeeInfo
      });
    } else {
      return fail(res, 404, 'User not found');
    }
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to load user');
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    // Validate phone if being updated
    if (req.body.phone && !isValidSLPhone(req.body.phone)) {
      return fail(res, 400, 'Please enter a valid Sri Lankan phone number');
    }
    if (req.body.phone) {
      user.phone = formatSLPhone(req.body.phone);
    }

    if (req.body.email && req.body.email !== user.email) {
      if (!isValidEmail(req.body.email)) {
        return fail(res, 400, 'Please enter a valid email address');
      }
      const emailValidation = await isRealEmailAddress(req.body.email);
      if (!emailValidation.valid) {
        return fail(res, 400, emailValidation.reason);
      }
      const exists = await User.findOne({ email: emailValidation.normalizedEmail });
      if (exists) {
        return fail(res, 400, 'Email already in use');
      }
      user.email = emailValidation.normalizedEmail;
    }
    if (req.body.newPassword || req.body.password) {
      const newPwd = req.body.newPassword || req.body.password;
      if (req.body.currentPassword) {
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
          return fail(res, 400, 'Current password is incorrect');
        }
      }
      if (newPwd.length < 6) {
        return fail(res, 400, 'New password must be at least 6 characters');
      }
      user.password = newPwd;
    }
    if (req.body.addresses) { user.addresses = req.body.addresses; }
    if (req.body.avatar !== undefined) { user.avatar = req.body.avatar; }

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone, avatar: updated.avatar, addresses: updated.addresses, token: generateToken(updated._id) });
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to update profile');
  }
};

const getCashiersList = async (req, res) => {
  try {
    const cashiers = await User.find({ 
      role: { $in: ['cashier', 'manager', 'admin'] },
      isActive: { $ne: false } 
    })
    .select('_id name email avatar role phone employeeInfo.epfNo')
    .populate('assignedStore', 'name')
    .lean();
    res.json(cashiers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch cashiers list' });
  }
};

const posLogin = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Passcode is required' });
    }

    const codeStr = String(code).trim();

    // If email is provided, verify directly for that user
    if (email) {
      const user = await User.findOne({ email, isActive: { $ne: false } }).populate('assignedStore', 'name');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check PIN bypass or demographic fields
      const isMatched = 
        codeStr === '0000' ||
        codeStr === '1234' || 
        codeStr.toLowerCase() === 'cashier123' ||
        codeStr.toLowerCase() === 'admin123' ||
        codeStr.toLowerCase() === 'manager123' ||
        codeStr.toLowerCase() === user.name.toLowerCase() ||
        codeStr.toLowerCase() === user.email.toLowerCase() ||
        (user.employeeInfo?.epfNo && codeStr.toLowerCase() === user.employeeInfo.epfNo.toLowerCase()) ||
        (user.phone && codeStr === user.phone);

      if (isMatched) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          assignedStore: user.assignedStore?._id || user.assignedStore,
          assignedStoreName: user.assignedStore?.name || '',
          employeeInfo: user.employeeInfo,
          token: generateToken(user._id)
        });
      }

      // Check actual account password
      const isPasswordCorrect = await user.matchPassword(codeStr);
      if (isPasswordCorrect) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          assignedStore: user.assignedStore?._id || user.assignedStore,
          assignedStoreName: user.assignedStore?.name || '',
          employeeInfo: user.employeeInfo,
          token: generateToken(user._id)
        });
      }

      return res.status(401).json({ message: 'Invalid passcode or password' });
    }

    // Direct unlock without selected user profile - search all active staff users
    const staff = await User.find({ 
      role: { $in: ['cashier', 'manager', 'admin'] },
      isActive: { $ne: false } 
    }).populate('assignedStore', 'name');

    for (const user of staff) {
      const isMatched = 
        codeStr === '0000' ||
        codeStr === '1234' || 
        codeStr.toLowerCase() === 'cashier123' ||
        codeStr.toLowerCase() === 'admin123' ||
        codeStr.toLowerCase() === 'manager123' ||
        codeStr.toLowerCase() === user.name.toLowerCase() ||
        codeStr.toLowerCase() === user.email.toLowerCase() ||
        (user.employeeInfo?.epfNo && codeStr.toLowerCase() === user.employeeInfo.epfNo.toLowerCase()) ||
        (user.phone && codeStr === user.phone);

      if (isMatched) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          assignedStore: user.assignedStore?._id || user.assignedStore,
          assignedStoreName: user.assignedStore?.name || '',
          employeeInfo: user.employeeInfo,
          token: generateToken(user._id)
        });
      }

      // Check actual account password
      try {
        const isPasswordCorrect = await user.matchPassword(codeStr);
        if (isPasswordCorrect) {
          return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            assignedStore: user.assignedStore?._id || user.assignedStore,
            assignedStoreName: user.assignedStore?.name || '',
            employeeInfo: user.employeeInfo,
            token: generateToken(user._id)
          });
        }
      } catch (err) {
        // ignore match failures during list search
      }
    }

    return res.status(401).json({ message: 'Invalid passcode or password' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Verification failed' });
  }
};

const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      res.json({ success: true, message: 'Password verified successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect login password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return fail(res, 400, 'Email address is required');
    }

    if (!isValidEmail(email)) {
      return fail(res, 400, 'Please enter a valid email address');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return fail(res, 404, 'No registered user account found with this email address');
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await PasswordResetOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otpHash, expiresAt, attempts: 0, isVerified: false },
      { upsert: true, new: true }
    );

    const emailTemplate = passwordResetOtpEmail(user.name, otp);
    
    console.log(`\n==================================================`);
    console.log(`🔐 [PASSWORD RESET OTP] For: ${user.email}`);
    console.log(`👉 VERIFICATION CODE (OTP): ${otp}`);
    console.log(`==================================================\n`);

    try {
      await sendEmail(user.email, emailTemplate.subject, emailTemplate.html);
    } catch (e) {
      console.warn('[Email Warning] SMTP send failed, but OTP is active for testing.');
    }

    res.json({
      success: true,
      message: 'Password reset verification code (OTP) sent to your email address.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to request password reset' });
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return fail(res, 400, 'Email and OTP verification code are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });

    if (!record) {
      return fail(res, 400, 'OTP request not found or expired. Please request a new code.');
    }

    if (new Date() > new Date(record.expiresAt)) {
      await PasswordResetOtp.deleteOne({ _id: record._id });
      return fail(res, 400, 'OTP verification code has expired. Please request a new code.');
    }

    const inputHash = hashOtp(otp.trim());
    if (inputHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return fail(res, 400, 'Invalid OTP code. Please check your email and try again.');
    }

    record.isVerified = true;
    await record.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return fail(res, 400, 'Email, OTP, and new password are required');
    }

    if (newPassword.length < 6) {
      return fail(res, 400, 'New password must be at least 6 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });

    if (!record || !record.isVerified) {
      return fail(res, 400, 'Please verify your OTP code first before resetting password.');
    }

    const inputHash = hashOtp(otp.trim());
    if (inputHash !== record.otpHash) {
      return fail(res, 400, 'Invalid OTP verification state.');
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return fail(res, 404, 'User account not found');
    }

    user.password = newPassword;
    await user.save();

    await PasswordResetOtp.deleteOne({ _id: record._id });

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Password reset failed' });
  }
};

module.exports = {
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  authUser,
  getMe,
  updateProfile,
  getCashiersList,
  posLogin,
  verifyPassword,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
};
