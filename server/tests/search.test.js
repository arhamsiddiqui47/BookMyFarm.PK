const request = require('supertest');
const { app, startDb, stopDb, clearDb, tokenFor } = require('./setup');
const Farmhouse = require('../src/models/Farmhouse');
const SlotLock = require('../src/models/SlotLock');
const User = require('../src/models/User');
const mongoose = require('mongoose');

beforeAll(startDb);
afterAll(stopDb);
afterEach(clearDb);

async function seed() {
  const owner = await User.create({ name: 'O', email: 'o@test.pk', password: 'secret1', role: 'owner' });
  const base = { owner: owner._id, photos: ['x.jpg'], status: 'approved' };
  const [a, b, c] = await Promise.all([
    Farmhouse.create({ ...base, name: 'A', area: 'Gadap Town', capacity: 50, amenities: ['pool', 'bbq'], pricing: { day: 20000, night: 25000, full: 40000 } }),
    Farmhouse.create({ ...base, name: 'B', area: 'Malir', capacity: 120, amenities: ['pool'], pricing: { full: 80000 } }),
    Farmhouse.create({ ...base, name: 'C', area: 'Gadap Town', capacity: 30, amenities: ['kids-area'], pricing: { day: 10000 } }),
  ]);
  await Farmhouse.create({ ...base, name: 'Hidden', area: 'Malir', capacity: 500, pricing: { day: 1 }, status: 'pending' });
  return { a, b, c };
}

const names = (res) => res.body.items.map((f) => f.name).sort();

describe('search and compare', () => {
  it('filters by area, guests, amenities and price', async () => {
    await seed();
    expect(names(await request(app).get('/api/farmhouses?area=Gadap Town'))).toEqual(['A', 'C']);
    expect(names(await request(app).get('/api/farmhouses?guests=100'))).toEqual(['B']);
    expect(names(await request(app).get('/api/farmhouses?amenities=pool,bbq'))).toEqual(['A']);
    expect(names(await request(app).get('/api/farmhouses?maxPrice=20000'))).toEqual(['A', 'C']);
    expect(names(await request(app).get('/api/farmhouses?slot=full&maxPrice=50000'))).toEqual(['A']);
  });

  it('never returns unverified listings', async () => {
    await seed();
    const res = await request(app).get('/api/farmhouses');
    expect(res.body.total).toBe(3);
  });

  it('hides farmhouses already booked for the chosen date and slot', async () => {
    const { a, b } = await seed();
    const booking = new mongoose.Types.ObjectId();
    await SlotLock.create({ farmhouse: a._id, date: '2026-12-25', half: 'day', booking });
    await SlotLock.create([
      { farmhouse: b._id, date: '2026-12-25', half: 'day', booking },
      { farmhouse: b._id, date: '2026-12-25', half: 'night', booking },
    ]);
    // Day slot: A and B are taken
    expect(names(await request(app).get('/api/farmhouses?date=2026-12-25&slot=day'))).toEqual(['C']);
    // Night slot: A is still free, B is fully booked, C has no night slot
    expect(names(await request(app).get('/api/farmhouses?date=2026-12-25&slot=night'))).toEqual(['A']);
    // Any slot: only fully booked B is hidden
    expect(names(await request(app).get('/api/farmhouses?date=2026-12-25'))).toEqual(['A', 'C']);
  });

  it('compares 2 to 3 farmhouses in the order asked', async () => {
    const { a, b } = await seed();
    const res = await request(app).get(`/api/farmhouses/compare?ids=${b._id},${a._id}`);
    expect(res.body.items.map((f) => f.name)).toEqual(['B', 'A']);
    expect((await request(app).get(`/api/farmhouses/compare?ids=${a._id}`)).status).toBe(400);
  });

  it('reports booked half-days for a month', async () => {
    const { a } = await seed();
    await SlotLock.create({ farmhouse: a._id, date: '2026-12-25', half: 'night', booking: new mongoose.Types.ObjectId() });
    const res = await request(app).get(`/api/farmhouses/${a._id}/availability?month=2026-12`);
    expect(res.body.booked).toEqual({ '2026-12-25': ['night'] });
  });

  it('keeps minPrice in sync with the cheapest slot', async () => {
    const { a } = await seed();
    expect(a.minPrice).toBe(20000);
    const owner = await tokenFor('owner');
    expect(owner).toBeTruthy();
  });
});
