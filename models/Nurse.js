const mongoose = require('mongoose');

const NurseSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      default: 'Elena Rostova, RN'
    },
    badgeId: {
      type: String,
      default: 'RN-9402'
    },
    role: {
      type: String,
      default: 'Head Nurse'
    },
    ward: {
      type: String,
      default: 'Ward 4B - Cardiology'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Nurse', NurseSchema);
