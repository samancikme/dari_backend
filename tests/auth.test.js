const request = require('supertest');
const app = require('../server');

describe('Nurse Authentication API Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should successfully authenticate nurse with valid credentials (nurse.elena / password123)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nurse.elena', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.nurse.username).toBe('nurse.elena');
      expect(res.body.nurse.fullName).toBe('Elena Rostova, RN');
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nurse.elena', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication Error');
    });

    it('should reject login with missing fields (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nurse.elena' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return nurse session info when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer demo-nurse-token-vito-2026');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.nurse.username).toBe('nurse.elena');
    });

    it('should reject access when Authorization token is missing (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
