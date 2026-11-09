const request = require('supertest');
const { app, startDb, stopDb, clearDb, tokenFor } = require('./setup');

// A tiny valid PNG so photo uploads work in tests.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

beforeAll(startDb);
afterAll(stopDb);
afterEach(clearDb);

function submitListing(token, overrides = {}) {
  const req = request(app)
    .post('/api/farmhouses')
    .set('Authorization', `Bearer ${token}`)
    .field('name', overrides.name || 'Vintage Vista Farmhouse')
    .field('area', 'Gadap Town')
    .field('capacity', '80')
    .field('amenities', JSON.stringify(['pool', 'kids-area']))
    .field('pricing', JSON.stringify({ day: 25000, night: 30000, full: 50000 }));
  return req.attach('photos', PNG, 'front.png');
}

describe('listing verification workflow', () => {
  it('keeps a new listing hidden until an admin approves it after a visit', async () => {
    const owner = await tokenFor('owner');
    const admin = await tokenFor('admin');

    const created = await submitListing(owner);
    expect(created.status).toBe(201);
    expect(created.body.farmhouse.status).toBe('pending');
    const id = created.body.farmhouse._id;

    // Not public yet
    expect((await request(app).get('/api/farmhouses')).body.items).toHaveLength(0);
    expect((await request(app).get(`/api/farmhouses/${id}`)).status).toBe(404);

    // Admin cannot approve without a visit
    const early = await request(app)
      .post(`/api/admin/farmhouses/${id}/decision`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ decision: 'approve', remarks: 'Looks fine' });
    expect(early.status).toBe(400);

    await request(app)
      .patch(`/api/admin/farmhouses/${id}/visit`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ visitDate: '2026-11-20' })
      .expect(200);

    const approved = await request(app)
      .post(`/api/admin/farmhouses/${id}/decision`)
      .set('Authorization', `Bearer ${admin}`)
      .field('decision', 'approve')
      .field('remarks', 'Visited, pool and kids area match photos')
      .attach('visitPhotos', PNG, 'visit.png');
    expect(approved.status).toBe(200);
    expect(approved.body.farmhouse.status).toBe('approved');

    const pub = await request(app).get('/api/farmhouses');
    expect(pub.body.items).toHaveLength(1);
  });

  it('sends an approved listing back to pending when the owner edits it', async () => {
    const owner = await tokenFor('owner');
    const admin = await tokenFor('admin');
    const id = (await submitListing(owner)).body.farmhouse._id;
    await request(app).patch(`/api/admin/farmhouses/${id}/visit`).set('Authorization', `Bearer ${admin}`).send({ visitDate: '2026-11-20' });
    await request(app).post(`/api/admin/farmhouses/${id}/decision`).set('Authorization', `Bearer ${admin}`).send({ decision: 'approve', remarks: 'ok' });

    const edited = await request(app)
      .patch(`/api/farmhouses/${id}`)
      .set('Authorization', `Bearer ${owner}`)
      .field('capacity', '120');
    expect(edited.body.farmhouse.status).toBe('pending');
    expect((await request(app).get('/api/farmhouses')).body.items).toHaveLength(0);
  });

  it('stops owners editing other owners listings and customers using admin routes', async () => {
    const ownerA = await tokenFor('owner');
    const ownerB = await tokenFor('owner');
    const customer = await tokenFor('customer');
    const id = (await submitListing(ownerA)).body.farmhouse._id;

    const res = await request(app).patch(`/api/farmhouses/${id}`).set('Authorization', `Bearer ${ownerB}`).field('capacity', '5');
    expect(res.status).toBe(403);
    expect((await request(app).get('/api/admin/farmhouses').set('Authorization', `Bearer ${customer}`)).status).toBe(403);
  });

  it('rejects a listing with no photos', async () => {
    const owner = await tokenFor('owner');
    const res = await request(app)
      .post('/api/farmhouses')
      .set('Authorization', `Bearer ${owner}`)
      .field('name', 'X').field('area', 'Malir').field('capacity', '10')
      .field('pricing', JSON.stringify({ day: 1000 }));
    expect(res.status).toBe(400);
  });

  it('lets the admin block a user so they cannot log in', async () => {
    const admin = await tokenFor('admin');
    await request(app).post('/api/auth/register').send({ name: 'C', email: 'c@test.pk', password: 'secret1' });
    const users = await request(app).get('/api/admin/users?role=customer').set('Authorization', `Bearer ${admin}`);
    await request(app).patch(`/api/admin/users/${users.body.items[0]._id}/block`).set('Authorization', `Bearer ${admin}`).send({ blocked: true }).expect(200);
    const login = await request(app).post('/api/auth/login').send({ email: 'c@test.pk', password: 'secret1' });
    expect(login.status).toBe(403);
  });
});
