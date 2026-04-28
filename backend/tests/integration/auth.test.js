const request = require('supertest');
const app = require('../../src/app');

describe('Auth API', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sirius.com', password: 'admin123' });
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sirius.com', password: 'wrong' });
    expect(res.body.success).toBe(false);
  });
});
