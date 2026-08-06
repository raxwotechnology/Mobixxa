const mongoose = require('mongoose');

const issuedLetterSchema = mongoose.Schema(
  {
    referenceNo: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ['hr', 'customer', 'general'],
      default: 'hr',
    },
    letterType: {
      type: String,
      required: true, // 'offer', 'appointment', 'part_time', 'resignation', 'salary_confirmation', 'service_cert', 'custom'
    },
    title: {
      type: String,
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientAddress: {
      type: String,
    },
    subject: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const IssuedLetter = mongoose.model('IssuedLetter', issuedLetterSchema);

module.exports = IssuedLetter;
