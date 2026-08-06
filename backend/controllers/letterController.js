const IssuedLetter = require('../models/IssuedLetter');

// @desc    Get all issued letters
// @route   GET /api/hr/letters
// @access  Private/Admin/Manager
const getIssuedLetters = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { referenceNo: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const letters = await IssuedLetter.find(query)
      .populate('employeeId', 'name email role employeeInfo')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(letters);
  } catch (error) {
    next(error);
  }
};

// @desc    Issue a new letter
// @route   POST /api/hr/letters
// @access  Private/Admin/Manager
const issueLetter = async (req, res, next) => {
  try {
    const { category, letterType, title, employeeId, recipientName, recipientAddress, subject, content } = req.body;
    
    if (!title || !recipientName || !content) {
      res.status(400);
      return next(new Error('Title, Recipient Name, and Content are required'));
    }

    const count = await IssuedLetter.countDocuments();
    const referenceNo = `REF-LTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const letter = await IssuedLetter.create({
      referenceNo,
      category: category || 'hr',
      letterType,
      title,
      employeeId: employeeId || null,
      recipientName,
      recipientAddress: recipientAddress || '',
      subject: subject || title,
      content,
      issuedBy: req.user._id,
      issueDate: new Date(),
    });

    const populated = await IssuedLetter.findById(letter._id)
      .populate('employeeId', 'name email role employeeInfo')
      .populate('issuedBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an issued letter
// @route   DELETE /api/hr/letters/:id
// @access  Private/Admin
const deleteLetter = async (req, res, next) => {
  try {
    const letter = await IssuedLetter.findById(req.params.id);
    if (!letter) {
      res.status(404);
      return next(new Error('Letter record not found'));
    }
    await letter.deleteOne();
    res.json({ message: 'Issued letter record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIssuedLetters,
  issueLetter,
  deleteLetter,
};
