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

// Mount API Routers
app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', vitoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VITO CUBE IoT Backend API Server',
    protocol: req.protocol,
    port: config.port,
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

let server;

async function startServer() {
  if (process.env.NODE_ENV !== 'test') {
    if (config.mongodbUri && config.mongodbUri !== 'memory' && config.mongodbUri.startsWith('mongodb')) {
      try {
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 2500
        });
        console.log(`[Database] Connected successfully to MongoDB`);
      } catch (err) {
        console.log(`[Database] Resilient In-Memory Mode Active (Offline Ready)`);
      }
    } else {
      console.log(`[Database] High-Speed In-Memory Mode Active`);
    }

    const useHttps = process.env.USE_HTTPS === 'true';
    const certPath = path.join(__dirname, 'certs', 'server.crt');
    const keyPath = path.join(__dirname, 'certs', 'server.key');

    if (useHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      server = https.createServer(options, app).listen(config.port, () => {
        console.log(`[Backend Server] VITO CUBE HTTPS API Server running on https://localhost:${config.port}`);
      });
    } else {
      server = http.createServer(app).listen(config.port, () => {
        console.log(`[Backend Server] VITO CUBE API Server running on http://localhost:${config.port}`);
      });
    }

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [Port Error] 5000-port band qilingan (Masalan: Ctrl+Z bilan jarayon fonda qolgan).`);
        console.error(`👉 Portni bo'shatish uchun konsolga ushbu buyruqni bering: fuser -k 5000/tcp\n`);
      }
    });
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
