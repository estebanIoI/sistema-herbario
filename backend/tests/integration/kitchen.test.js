const request = require('supertest');
const app = require('../../src/app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@sirius.com', password: 'admin123' });
  token = res.body.data.token;
});

describe('Kitchen API', () => {
  it('should get active kitchen orders', async () => {
    const res = await request(app)
      .get('/api/kitchen/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
