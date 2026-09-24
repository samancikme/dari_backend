const request = require('supertest');
const app = require('../server');
const Telemetry = require('../models/Telemetry');

describe('IoT Telemetry API Endpoints (Unit & Integration Suite)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('should return server health status with status 200', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('POST /api/data', () => {
    it('should successfully validate & store valid IoT telemetry payload and return 201', async () => {
      const mockSaved = {
        _id: '507f1f77bcf86cd799439011',
        device: 'ESP32_Room_01',
        status: 'online',
        temp: 24.8,
        timestamp: new Date().toISOString()
      };

      jest.spyOn(Telemetry.prototype, 'save').mockResolvedValue(mockSaved);

      const payload = {
        device: 'ESP32_Room_01',
        status: 'online',
        temp: 24.8
      };

      const res = await request(app).post('/api/data').send(payload);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.device).toBe('ESP32_Room_01');
      expect(res.body.data.status).toBe('online');
      expect(res.body.data.temp).toBe(24.8);
      expect(res.body.data).toHaveProperty('timestamp');
    });

    it('should reject payload missing "device" with 400 Bad Request', async () => {
      const payload = {
        status: 'online',
        temp: 22.0
      };

      const res = await request(app).post('/api/data').send(payload);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toContain('Field "device" must be a non-empty string.');
    });

    it('should reject payload with invalid "status" with 400 Bad Request', async () => {
      const payload = {
        device: 'ESP32_Test',
        status: 'invalid_status_value',
        temp: 25.0
      };

      const res = await request(app).post('/api/data').send(payload);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details[0]).toContain('Field "status" must be one of');
    });

    it('should reject payload with non-numeric "temp" with 400 Bad Request', async () => {
      const payload = {
        device: 'ESP32_Test',
        status: 'online',
        temp: 'hot'
      };

      const res = await request(app).post('/api/data').send(payload);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toContain('Field "temp" must be a valid number.');
    });
  });

  describe('GET /api/data', () => {
    it('should retrieve recent telemetry records sorted by timestamp', async () => {
      const res = await request(app).get('/api/data');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/data/stats', () => {
    it('should return overview statistics and online status metrics', async () => {
      const res = await request(app).get('/api/data/stats');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('totalPayloads');
      expect(res.body).toHaveProperty('isDeviceOnline');
      expect(res.body).toHaveProperty('stats');
    });
  });
});
