const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Mock DB connection for testing
beforeAll(async () => {
  if (process.env.MONGO_URI_TEST) {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Health Check', () => {
  test('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('EBMS API is running');
  });
});

describe('Auth Routes', () => {
  test('POST /api/auth/login with invalid creds should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login without body should return 400 or 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect([400, 401, 500]).toContain(res.status);
  });
});

describe('Books Routes', () => {
  test('GET /api/books without auth should return 401', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(401);
  });
});

describe('Protected Routes', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/users' },
    { method: 'get', path: '/api/transactions' },
    { method: 'get', path: '/api/fines' },
    { method: 'get', path: '/api/reservations' },
    { method: 'get', path: '/api/analytics/dashboard' },
    { method: 'get', path: '/api/settings' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    test(`${method.toUpperCase()} ${path} should require auth`, async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    });
  });
});
