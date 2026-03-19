const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let driverToken;
let engineerUserId;
let projectId;

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
  engineerUserId = eng.body.user.id;

  const drv = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Drv User', email: 'drv@example.com', password: 'password123', role: 'driver' });
  driverToken = drv.body.token;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
    name: 'Test Logbook Project',
    location: 'Lusaka',
    status: 'planning',
    budget: 100000
  });
  projectId = projectRes.body._id;
});

const makeWorkLogPayload = () => ({
  type: 'work',
  date: new Date().toISOString(),
  projectId,
  workerId: engineerUserId,
  project: projectId,
  worker: engineerUserId,
  hours: 8,
  distance: 0,
  hoursWorked: 8,
  description: 'Routine daily log',
  site: 'Site A'
});

const makeVehicleLogPayload = () => ({
  type: 'vehicle',
  date: new Date().toISOString(),
  projectId,
  project: projectId,
  distanceKm: 120,
  distanceTravelled: 120,
  distance: 120,
  fuelLitres: 15,
  route: 'Lusaka to Kafue',
  vehicleNumber: 'AAA 1234',
  description: 'Vehicle movement log'
});

describe('POST /api/logbooks', () => {
  it('engineer can create a work logbook entry', async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(makeWorkLogPayload());

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ type: 'work', hoursWorked: 8, hours: 8, description: 'Routine daily log' });
    expect(res.body).toHaveProperty('createdBy');
    expect(res.body.workerId?.name).toBe('Eng User');
    expect(res.body.projectId?.name).toBe('Test Logbook Project');
  });

  it('driver can create a vehicle logbook entry', async () => {
    const res = await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(makeVehicleLogPayload());

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ type: 'vehicle', distanceKm: 120, distanceTravelled: 120, distance: 120 });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/logbooks').send(makeWorkLogPayload());
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/logbooks', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(makeWorkLogPayload());

    await request(app)
      .post('/api/logbooks')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(makeVehicleLogPayload());
  });

  it('engineer sees all logbook entries', async () => {
    const res = await request(app)
      .get('/api/logbooks')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('entries');
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0]).toHaveProperty('projectId');
    expect(res.body.entries[0]).toHaveProperty('workerId');
    expect(res.body.entries[0].date).toBeTruthy();
    expect(res.body.entries[0].description || res.body.entries[0].notes).toBeTruthy();
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
      .send(makeWorkLogPayload());
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
      .send(makeWorkLogPayload());
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
