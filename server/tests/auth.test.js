const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('auth', () => {
  it('registers a customer and returns a token without the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ali', email: 'ali@test.pk', password: 'secret1', phone: '03001234567' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.password).toBeUndefined();
  });

  it('does not let anyone register as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Hacker', email: 'h@test.pk', password: 'secret1', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('rejects a wrong password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@test.pk', password: 'secret1' });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.pk', password: 'nope123' });
    expect(res.status).toBe(401);
  });

  it('enforces roles on dashboards', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Owner', email: 'o@test.pk', password: 'secret1', role: 'owner' });
    const token = reg.body.token;
    const ok = await request(app).get('/api/dashboard/owner').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    const denied = await request(app).get('/api/dashboard/admin').set('Authorization', `Bearer ${token}`);
    expect(denied.status).toBe(403);
    const anon = await request(app).get('/api/dashboard/owner');
    expect(anon.status).toBe(401);
  });

  it('blocks a blocked user from logging in', async () => {
    await User.create({ name: 'B', email: 'b@test.pk', password: 'secret1', isBlocked: true });
    const res = await request(app).post('/api/auth/login').send({ email: 'b@test.pk', password: 'secret1' });
    expect(res.status).toBe(403);
  });
});
