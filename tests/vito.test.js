const request = require('supertest');
const app = require('../server');

describe('VITO CUBE IoT Medical Dispenser Endpoints', () => {
  const testDevice = 'TEST-CUBE-99';

  describe('GET /api/slots/:deviceId', () => {
    it('should return exactly 14 slots for a new device ID', async () => {
      const res = await request(app).get(`/api/slots/${testDevice}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toEqual(14);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].slotId).toEqual(1);
      expect(res.body.data[13].slotId).toEqual(14);
    });
  });

  describe('PUT /api/slots/:deviceId/:slotId', () => {
    it('should update medication name and dispense time for slot #5', async () => {
      const updatePayload = {
        medName: 'Amoxicillin 500mg',
        dispenseTime: '14:30',
        dosage: '1 Capsule',
        status: 'scheduled'
      };

      const res = await request(app)
        .put(`/api/slots/${testDevice}/5`)
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.medName).toEqual('Amoxicillin 500mg');
      expect(res.body.data.dispenseTime).toEqual('14:30');
      expect(res.body.data.status).toEqual('scheduled');
    });

    it('should return 400 Bad Request if slotId is invalid (>14)', async () => {
      const res = await request(app)
        .put(`/api/slots/${testDevice}/99`)
        .send({ medName: 'Test' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/logs & GET /api/logs/:deviceId', () => {
    it('should record a dispense log and retrieve history stream', async () => {
      const logPayload = {
        deviceId: testDevice,
        slotId: 5,
        medName: 'Amoxicillin 500mg',
        status: 'dispensed'
      };

      const postRes = await request(app).post('/api/logs').send(logPayload);
      expect(postRes.statusCode).toEqual(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.medName).toEqual('Amoxicillin 500mg');

      const getRes = await request(app).get(`/api/logs/${testDevice}`);
      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.count).toBeGreaterThan(0);
      expect(getRes.body.data[0].medName).toEqual('Amoxicillin 500mg');
    });
  });

  describe('GET /api/patients/:deviceId', () => {
    it('should return patient profile overview', async () => {
      const res = await request(app).get(`/api/patients/${testDevice}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('patientName');
    });
  });
});
