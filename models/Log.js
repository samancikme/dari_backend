const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      trim: true,
      index: true
    },
    device_id: {
      type: String,
      trim: true
    },
    slotId: {
      type: Number,
      required: [true, 'Slot ID is required']
    },
    slot_number: {
      type: Number
    },
    medName: {
      type: String,
      default: 'Dori'
    },
    med_name: {
      type: String,
      default: 'Dori'
    },
    status: {
      type: String,
      enum: ['dispensed', 'triggered'],
      default: 'dispensed'
    },
    nurseName: {
      type: String,
      default: 'Hamshira Elena R.'
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
