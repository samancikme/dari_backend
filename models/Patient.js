const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    patientName: {
      type: String,
      default: 'Eleanor Vance'
    },
    age: {
      type: Number,
      default: 72
    },
    condition: {
      type: String,
      default: 'Post-Op Cardiac Care'
    },
    notes: {
      type: String,
      default: 'Requires daily morning & evening medication reminders.'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', PatientSchema);
