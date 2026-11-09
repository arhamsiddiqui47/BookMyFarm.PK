// Shared test helpers: an in-memory MongoDB and quick ways to create users.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

let mongo;

async function startDb() {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

async function clearDb() {
  const cols = await mongoose.connection.db.collections();
  await Promise.all(cols.map((c) => c.deleteMany({})));
}

async function tokenFor(role, email = `${role}${Date.now()}${Math.random()}@test.pk`) {
  if (role === 'admin') {
    await User.create({ name: 'Admin', email, password: 'secret1', role: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret1' });
    return res.body.token;
  }
  const res = await request(app).post('/api/auth/register').send({ name: role, email, password: 'secret1', role });
  return res.body.token;
}

module.exports = { app, startDb, stopDb, clearDb, tokenFor };
