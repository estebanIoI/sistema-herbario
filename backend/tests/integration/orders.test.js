const request = require('supertest');
const app = require('../../src/app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@sirius.com', password: 'admin123' });
  token = res.body.data.token;
});

describe('Orders API', () => {
  it('should create a new order', async () => {
    const orderData = {
      tableId: 1,
      waiterId: 1,
      items: [{ menuItemId: 1, quantity: 2 }]
    };
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });
});
