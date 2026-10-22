const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const config = require('./config');
const apiRoutes = require('./routes/api');
const vitoRoutes = require('./routes/vito');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome & API catalog endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'VITOCUBE IoT Medical Dispenser Backend API',
    version: '1.0.0',
    documentation: '/health',
    endpoints: {
      health: 'GET /health',
      authLogin: 'POST /api/auth/login',
      authRegister: 'POST /api/auth/register',
      authMe: 'GET /api/auth/me',
      slots: 'GET /api/slots/:deviceId',
      updateSlot: 'PUT /api/slots/:deviceId/:slotId',
      logs: 'GET /api/logs/:deviceId',
      createLog: 'POST /api/logs',
      patients: 'GET /api/patients',
      patientDetails: 'GET /api/patients/:deviceId',
      telemetry: 'GET/POST /api/data',
      telemetryStats: 'GET /api/data/stats'
    }
  });
});

// Mount API Routers
app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', vitoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VITOCUBE IoT Backend API Server',
    protocol: req.protocol,
    port: config.port,
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1,
    environment: config.nodeEnv
  });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected server error occurred.'
  });
});

let server;

async function startServer() {
  if (process.env.NODE_ENV !== 'test') {
    if (config.mongodbUri && config.mongodbUri !== 'memory' && config.mongodbUri.startsWith('mongodb')) {
      try {
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`[Database] Connected successfully to MongoDB`);
      } catch (err) {
        console.warn(`[Database] Warning: MongoDB connection failed (${err.message}). Resilient In-Memory Mode Active.`);
      }
    } else {
      console.log(`[Database] High-Speed In-Memory Mode Active`);
    }

    const useHttps = process.env.USE_HTTPS === 'true';
    const certPath = path.join(__dirname, 'certs', 'server.crt');
    const keyPath = path.join(__dirname, 'certs', 'server.key');
    const activePort = process.env.PORT || config.port || 5000;

    if (useHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      server = https.createServer(options, app).listen(activePort, () => {
        console.log(`[Backend Server] VITOCUBE HTTPS API Server running on port ${activePort}`);
      });
    } else {
      server = http.createServer(app).listen(activePort, () => {
        console.log(`[Backend Server] VITOCUBE API Server running on port ${activePort}`);
      });
    }

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [Port Error] ${activePort}-port band qilingan.`);
        console.error(`👉 Portni bo'shatish uchun: fuser -k ${activePort}/tcp\n`);
      }
    });
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
