const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let directorToken;
let engineerUserId;

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

  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dir User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;
});

const fundingPayload = {
  title: 'Site Materials',
  description: 'Purchase of concrete and rebar',
  amount: 25000,
  site: 'Site B',
  priority: 'high'
};

describe('POST /api/funding-requests', () => {
  it('creates a funding request for an authenticated user', async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ title: 'Site Materials', amount: 25000, status: 'pending' });
    expect(res.body.requestedBy).toMatchObject({ email: 'eng@example.com' });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/funding-requests').send(fundingPayload);
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/funding-requests', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);
  });

  it('returns own requests for engineer', async () => {
    const res = await request(app)
      .get('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0]).toMatchObject({ title: 'Site Materials' });
  });

  it('returns all requests for director', async () => {
    const res = await request(app)
      .get('/api/funding-requests')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.requests).toHaveLength(1);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/funding-requests');
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/funding-requests/:id/approve', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);
    requestId = res.body._id;
  });

  it('director can approve a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.approvedBy).toMatchObject({ email: 'dir@example.com' });
  });

  it('engineer cannot approve a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/funding-requests/:id', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);
    requestId = res.body._id;
  });

  it('engineer can update a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ ...fundingPayload, title: 'Updated Funding Title' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Funding Title');
  });

  it('director cannot update a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ ...fundingPayload, title: 'Director Edit' });

    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /api/funding-requests/:id (soft delete)', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);
    requestId = res.body._id;
  });

  it('engineer can soft delete a funding request', async () => {
    const res = await request(app)
      .delete(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.request.isActive).toBe(false);
  });

  it('director cannot soft delete a funding request', async () => {
    const res = await request(app)
      .delete(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/funding-requests/:id/reject', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(fundingPayload);
    requestId = res.body._id;
  });

  it('director can reject a funding request with a reason', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: 'Over budget' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.rejectionReason).toBe('Over budget');
  });

  it('engineer cannot reject a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/reject`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ rejectionReason: 'No reason' });

    expect(res.statusCode).toBe(403);
  });
});
