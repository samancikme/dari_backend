const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema(
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
      required: [true, 'Slot ID (1-14) is required'],
      min: 1,
      max: 14
    },
    slot_number: {
      type: Number,
      min: 1,
      max: 14
    },
    medName: {
      type: String,
      default: '',
      trim: true
    },
    med_name: {
      type: String,
      default: '',
      trim: true
    },
    dispenseTime: {
      type: String,
      default: '',
      trim: true
    },
    time: {
      type: String,
      default: '',
      trim: true
    },
    dosage: {
      type: String,
      default: '1 Tabletka'
    },
    status: {
      type: String,
      enum: ['empty', 'scheduled', 'dispensed'],
      default: 'empty'
    },
    lastDispensedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

SlotSchema.index({ deviceId: 1, slotId: 1 }, { unique: true });
SlotSchema.index({ device_id: 1, slot_number: 1 }, { unique: true, sparse: true });

// Pre-save middleware to keep camelCase and snake_case properties synchronized
SlotSchema.pre('save', function (next) {
  if (this.device_id) this.deviceId = this.device_id;
  else if (this.deviceId) this.device_id = this.deviceId;

  if (this.slot_number) this.slotId = this.slot_number;
  else if (this.slotId) this.slot_number = this.slotId;

  if (this.med_name !== undefined) this.medName = this.med_name;
  else if (this.medName !== undefined) this.med_name = this.medName;

  if (this.time !== undefined) this.dispenseTime = this.time;
  else if (this.dispenseTime !== undefined) this.time = this.dispenseTime;

  next();
});

module.exports = mongoose.model('Slot', SlotSchema);
