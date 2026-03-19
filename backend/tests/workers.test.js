const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let directorToken;
let workerUserToken;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();

  // Register engineer
  const eng = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Eng User', email: 'eng@example.com', password: 'password123', role: 'engineer' });
  engineerToken = eng.body.token;

  // Register director
  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dir User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;

  // Register a plain worker user (no deactivation privilege)
  const wkr = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Wkr User', email: 'wkr@example.com', password: 'password123', role: 'worker' });
  workerUserToken = wkr.body.token;
});

const workerPayload = {
  name: 'John Worker',
  nrc: '123456/78/1',
  phone: '0977123456',
  dailyRate: 150,
  site: 'Site A',
  mobileNetwork: 'airtel',
  role: 'worker'
};

describe('POST /api/workers', () => {
  it('creates a worker when authenticated', async () => {
    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ name: 'John Worker', nrc: '123456/78/1' });
    expect(res.body).toHaveProperty('enrolledBy');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/workers').send(workerPayload);
    expect(res.statusCode).toBe(401);
  });

  it('returns 500 when NRC is duplicated', async () => {
    await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);

    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);

    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/workers', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);
  });

  it('returns list of workers for authenticated user', async () => {
    const res = await request(app)
      .get('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('workers');
    expect(res.body.workers).toHaveLength(1);
    expect(res.body.workers[0]).toMatchObject({ name: 'John Worker' });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/workers/search', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);
  });

  it('finds a worker by NRC', async () => {
    const res = await request(app)
      .get('/api/workers/search?nrc=123456%2F78%2F1')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.worker).toMatchObject({ nrc: '123456/78/1' });
  });

  it('returns 404 for unknown NRC', async () => {
    const res = await request(app)
      .get('/api/workers/search?nrc=000000%2F00%2F0')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when NRC param is missing', async () => {
    const res = await request(app)
      .get('/api/workers/search')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/workers/:id', () => {
  let workerId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);
    workerId = res.body._id;
  });

  it('returns a single worker by id', async () => {
    const res = await request(app)
      .get(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ name: 'John Worker' });
  });

  it('returns 404 for an unknown id', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .get(`/api/workers/${fakeId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/workers/:id', () => {
  let workerId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);
    workerId = res.body._id;
  });

  it('engineer can update a worker', async () => {
    const res = await request(app)
      .put(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ ...workerPayload, name: 'Updated Worker' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Worker');
  });

  it('returns 403 when called by director', async () => {
    const res = await request(app)
      .put(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ ...workerPayload, name: 'Director Edit' });

    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /api/workers/:id (deactivate)', () => {
  let workerId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(workerPayload);
    workerId = res.body._id;
  });

  it('returns 403 when called by director', async () => {
    const res = await request(app)
      .delete(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('soft deletes a worker when called by engineer', async () => {
    const res = await request(app)
      .delete(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.worker.status).toBe('inactive');
    expect(res.body.worker.isActive).toBe(false);
  });

  it('returns 403 when called by a worker-role user', async () => {
    const res = await request(app)
      .delete(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${workerUserToken}`);

    expect(res.statusCode).toBe(403);
  });
});
