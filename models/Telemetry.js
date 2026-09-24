const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema(
  {
    device: {
      type: String,
      required: [true, 'Device name/ID is required'],
      trim: true,
      minlength: [2, 'Device name must be at least 2 characters']
    },
    status: {
      type: String,
      required: [true, 'Device status is required'],
      enum: {
        values: ['online', 'offline', 'warning', 'critical'],
        message: 'Status must be one of: online, offline, warning, critical'
      },
      lowercase: true,
      trim: true
    },
    temp: {
      type: Number,
      required: [true, 'Temperature value is required']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

TelemetrySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Telemetry', TelemetrySchema);
