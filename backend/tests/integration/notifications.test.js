const request = require('supertest');
const app = require('../../src/app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@sirius.com', password: 'admin123' });
  token = res.body.data.token;
});

describe('Notifications API', () => {
  it('should send a notification', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ to: 'mesero', message: '¡Pedido listo!', type: 'info' });
    expect(res.body.success).toBe(true);
  });
});
