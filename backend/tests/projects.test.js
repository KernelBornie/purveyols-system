const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let directorToken;
let workerToken;

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

  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dir User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;

  const wkr = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Wkr User', email: 'wkr@example.com', password: 'password123', role: 'worker' });
  workerToken = wkr.body.token;
});

const projectPayload = {
  name: 'Bridge Construction',
  description: 'Build a bridge over the river',
  location: 'Lusaka',
  status: 'planning',
  budget: 500000
};

describe('POST /api/projects', () => {
  it('creates a project when called by engineer', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(projectPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ name: 'Bridge Construction', status: 'planning' });
  });

  it('creates a project when called by director', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${directorToken}`)
      .send(projectPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ name: 'Bridge Construction' });
  });

  it('returns 403 when called by a worker-role user', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(projectPayload);

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/projects').send(projectPayload);
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/projects', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(projectPayload);
  });

  it('returns list of projects for authenticated user', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Bridge Construction' });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/projects/:id', () => {
  let projectId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(projectPayload);
    projectId = res.body._id;
  });

  it('returns a single project by id', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ name: 'Bridge Construction' });
  });

  it('returns 404 for an unknown id', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/projects/:id', () => {
  let projectId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(projectPayload);
    projectId = res.body._id;
  });

  it('updates a project when authenticated', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ status: 'active' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('active');
  });
});

describe('DELETE /api/projects/:id', () => {
  let projectId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(projectPayload);
    projectId = res.body._id;
  });

  it('director can delete a project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 403 when called by a worker-role user', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(res.statusCode).toBe(403);
  });
});
