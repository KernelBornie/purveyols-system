const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let driverToken;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();

  const eng = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Eng User', email: 'eng@example.com', password: 'password123', role: 'engineer' });
  engineerToken = eng.body.token;

  const drv = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Drv User', email: 'drv@example.com', password: 'password123', role: 'driver' });
  driverToken = drv.body.token;
});

const workLogPayload = {
  type: 'work',
  date: new Date().toISOString(),
  hoursWorked: 8,
  site: 'Site A',
  notes: 'Routine daily log'
};

const vehicleLogPayload = {
  type: 'vehicle',
  date: new Date().toISOString(),
  distanceKm: 120,
  fuelLitres: 15,
  route: 'Lusaka to Kafue',
  vehicleNumber: 'AAA 1234'
};

describe('POST /api/logbooks', () => {
  it('engineer can create a work logbook entry', async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workLogPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ type: 'work', hoursWorked: 8 });
    expect(res.body).toHaveProperty('createdBy');
  });

  it('driver can create a vehicle logbook entry', async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(vehicleLogPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ type: 'vehicle', distanceKm: 120 });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/logbooks').send(workLogPayload);
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/logbooks', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workLogPayload);

    await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(vehicleLogPayload);
  });

  it('engineer sees all logbook entries', async () => {
    const res = await request(app)
      .get('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('entries');
    expect(res.body.entries).toHaveLength(2);
  });

  it('driver sees only their own logbook entries', async () => {
    const res = await request(app)
      .get('/api/logbooks')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].type).toBe('vehicle');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/logbooks');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/logbooks/:id', () => {
  let logbookId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workLogPayload);
    logbookId = res.body._id;
  });

  it('returns a single logbook entry by id', async () => {
    const res = await request(app)
      .get(`/api/logbooks/${logbookId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ type: 'work' });
  });

  it('returns 404 for an unknown id', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .get(`/api/logbooks/${fakeId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/logbooks/:id', () => {
  let logbookId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workLogPayload);
    logbookId = res.body._id;
  });

  it('updates a logbook entry when authenticated', async () => {
    const res = await request(app)
      .put(`/api/logbooks/${logbookId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ notes: 'Updated notes', verified: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toBe('Updated notes');
    expect(res.body).toHaveProperty('verifiedBy');
  });
});
