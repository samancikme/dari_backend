const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      trim: true,
      index: true
    },
    slotId: {
      type: Number,
      required: [true, 'Slot ID is required']
    },
    medName: {
      type: String,
      default: 'Dori'
    },
    status: {
      type: String,
      enum: ['dispensed', 'triggered'],
      default: 'dispensed'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

LogSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('Log', LogSchema);
