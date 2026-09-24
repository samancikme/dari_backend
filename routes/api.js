const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Telemetry = require('../models/Telemetry');
const config = require('../config');

const router = express.Router();
const inMemoryTelemetryStore = [];

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many telemetry payloads sent from this IP, please try again later.'
  }
});

function validateTelemetryPayload(req, res, next) {
  const { device, status, temp } = req.body;
  const errors = [];

  if (!device || typeof device !== 'string' || device.trim().length === 0) {
    errors.push('Field "device" must be a non-empty string.');
  }

  const validStatuses = ['online', 'offline', 'warning', 'critical'];
  if (!status || typeof status !== 'string' || !validStatuses.includes(status.toLowerCase().trim())) {
    errors.push(`Field "status" must be one of: ${validStatuses.join(', ')}.`);
  }

  if (temp === undefined || temp === null || typeof temp !== 'number' || isNaN(temp)) {
    errors.push('Field "temp" must be a valid number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  next();
}

router.post('/data', apiLimiter, validateTelemetryPayload, async (req, res) => {
  try {
    const { device, status, temp } = req.body;
    const now = new Date();

    const recordData = {
      _id: new mongoose.Types.ObjectId().toString(),
      device: device.trim(),
      status: status.toLowerCase().trim(),
      temp: Number(temp),
      timestamp: now,
      createdAt: now
    };

    let saved = recordData;

    if (mongoose.connection.readyState === 1) {
      const dbRecord = new Telemetry({
        device: recordData.device,
        status: recordData.status,
        temp: recordData.temp,
        timestamp: now
      });
      saved = await dbRecord.save();
    }

    inMemoryTelemetryStore.unshift(recordData);
    if (inMemoryTelemetryStore.length > 200) {
      inMemoryTelemetryStore.pop();
    }

    return res.status(201).json({
      success: true,
      message: 'Telemetry data stored successfully',
      data: saved
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

router.get('/data', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const deviceFilter = req.query.device;

    let telemetryEntries = [];

    if (mongoose.connection.readyState === 1) {
      const query = deviceFilter ? { device: deviceFilter } : {};
      telemetryEntries = await Telemetry.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } else {
      telemetryEntries = inMemoryTelemetryStore
        .filter(r => !deviceFilter || r.device === deviceFilter)
        .slice(0, limit);
    }

    return res.status(200).json({
      success: true,
      count: telemetryEntries.length,
      data: telemetryEntries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

router.get('/data/stats', async (req, res) => {
  try {
    let latest = null;
    let count = 0;
    let stats = { avgTemp24h: 0, maxTemp24h: 0, minTemp24h: 0 };
    let isOnline = false;

    if (mongoose.connection.readyState === 1) {
      latest = await Telemetry.findOne().sort({ timestamp: -1 }).lean();
      count = await Telemetry.countDocuments();

      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const avgResult = await Telemetry.aggregate([
        { $match: { timestamp: { $gte: dayAgo } } },
        { $group: { _id: null, avgTemp: { $avg: '$temp' }, maxTemp: { $max: '$temp' }, minTemp: { $min: '$temp' } } }
      ]);
      const resStats = avgResult[0] || {};
      stats = {
        avgTemp24h: resStats.avgTemp ? Number(resStats.avgTemp.toFixed(1)) : (latest ? latest.temp : 0),
        maxTemp24h: resStats.maxTemp || (latest ? latest.temp : 0),
        minTemp24h: resStats.minTemp || (latest ? latest.temp : 0)
      };

      const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
      const recentPing = await Telemetry.findOne({ timestamp: { $gte: thirtySecsAgo } });
      isOnline = Boolean(recentPing);
    } else {
      count = inMemoryTelemetryStore.length;
      latest = inMemoryTelemetryStore[0] || null;

      if (count > 0) {
        const temps = inMemoryTelemetryStore.map(r => r.temp);
        const sum = temps.reduce((a, b) => a + b, 0);
        stats = {
          avgTemp24h: Number((sum / count).toFixed(1)),
          maxTemp24h: Math.max(...temps),
          minTemp24h: Math.min(...temps)
        };
        const lastTimestamp = new Date(latest.timestamp).getTime();
        isOnline = (Date.now() - lastTimestamp) < 30000;
      }
    }

    return res.status(200).json({
      success: true,
      totalPayloads: count,
      latestReading: latest || null,
      isDeviceOnline: isOnline,
      lastSeen: latest ? latest.timestamp : null,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
