const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let workerRoleToken;

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

  const wkr = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Wkr User', email: 'wkr@example.com', password: 'password123', role: 'worker' });
  workerRoleToken = wkr.body.token;
});

// ─── Worker ────────────────────────────────────────────────────────────────────

describe('PUT /api/workers/:id/deactivate', () => {
  let workerId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ name: 'Jane Worker', nrc: '999999/99/9', phone: '0977000000', dailyRate: 100, site: 'Site X', mobileNetwork: 'airtel', role: 'worker' });
    workerId = res.body._id;
  });

  it('engineer can deactivate a worker', async () => {
    const res = await request(app)
      .put(`/api/workers/${workerId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.worker.status).toBe('inactive');
    expect(res.body.worker.isActive).toBe(false);
  });

  it('non-engineer user cannot deactivate a worker', async () => {
    const res = await request(app)
      .put(`/api/workers/${workerId}/deactivate`)
      .set('Authorization', `Bearer ${workerRoleToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for unknown worker id', async () => {
    const res = await request(app)
      .put('/api/workers/64a000000000000000000001/deactivate')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('deactivated worker is hidden from list endpoint', async () => {
    await request(app)
      .put(`/api/workers/${workerId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    const listRes = await request(app)
      .get('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.workers).toHaveLength(0);
  });
});

// ─── FundingRequest ────────────────────────────────────────────────────────────

describe('PUT /api/funding-requests/:id/deactivate', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Test Funding', description: 'Some description', amount: 5000, priority: 'medium' });
    requestId = res.body._id;
  });

  it('engineer can deactivate a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.request.isActive).toBe(false);
  });

  it('non-engineer user cannot deactivate a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}/deactivate`)
      .set('Authorization', `Bearer ${workerRoleToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('deactivated funding request is hidden from list endpoint', async () => {
    await request(app)
      .put(`/api/funding-requests/${requestId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    const listRes = await request(app)
      .get('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.requests).toHaveLength(0);
  });
});

// ─── FundingRequest edit (PUT /:id) ────────────────────────────────────────────

describe('PUT /api/funding-requests/:id', () => {
  let requestId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Original Title', description: 'Original desc', amount: 3000, priority: 'low' });
    requestId = res.body._id;
  });

  it('engineer can update a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Updated Title', description: 'Updated desc', amount: 6000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.amount).toBe(6000);
  });

  it('worker-role user cannot update a funding request', async () => {
    const res = await request(app)
      .put(`/api/funding-requests/${requestId}`)
      .set('Authorization', `Bearer ${workerRoleToken}`)
      .send({ title: 'Hacked' });

    expect(res.statusCode).toBe(403);
  });
});

// ─── ProcurementOrder ──────────────────────────────────────────────────────────

describe('PUT /api/procurement/:id/deactivate', () => {
  let orderId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ items: [{ name: 'Steel Rods', quantity: 50 }] });
    orderId = res.body._id;
  });

  it('engineer can deactivate a procurement order', async () => {
    const res = await request(app)
      .put(`/api/procurement/${orderId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order.isActive).toBe(false);
  });

  it('non-engineer user cannot deactivate a procurement order', async () => {
    const res = await request(app)
      .put(`/api/procurement/${orderId}/deactivate`)
      .set('Authorization', `Bearer ${workerRoleToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('deactivated procurement order is hidden from list endpoint', async () => {
    await request(app)
      .put(`/api/procurement/${orderId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    const listRes = await request(app)
      .get('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body).toHaveLength(0);
  });
});

// ─── Subcontract ───────────────────────────────────────────────────────────────

describe('PUT /api/subcontracts/:id/deactivate', () => {
  let subcontractId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/subcontracts')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ type: 'personnel', name: 'John Electrician', company: 'ElecCo', dateHired: new Date().toISOString(), amount: 12000, site: 'Site A' });
    subcontractId = res.body.subcontract._id;
  });

  it('engineer can deactivate a subcontract', async () => {
    const res = await request(app)
      .put(`/api/subcontracts/${subcontractId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.subcontract.isActive).toBe(false);
  });

  it('non-engineer user cannot deactivate a subcontract', async () => {
    const res = await request(app)
      .put(`/api/subcontracts/${subcontractId}/deactivate`)
      .set('Authorization', `Bearer ${workerRoleToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('deactivated subcontract is hidden from list endpoint', async () => {
    await request(app)
      .put(`/api/subcontracts/${subcontractId}/deactivate`)
      .set('Authorization', `Bearer ${engineerToken}`);

    const listRes = await request(app)
      .get('/api/subcontracts')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.subcontracts).toHaveLength(0);
  });
});

describe('DELETE /api/subcontracts/:id', () => {
  let subcontractId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/subcontracts')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ type: 'personnel', name: 'Delete Me', company: 'DelCo', dateHired: new Date().toISOString(), amount: 5000, site: 'Site A' });
    subcontractId = res.body.subcontract._id;
  });

  it('engineer soft deletes subcontract', async () => {
    const res = await request(app)
      .delete(`/api/subcontracts/${subcontractId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.subcontract.isActive).toBe(false);
  });

  it('non-engineer cannot delete subcontract', async () => {
    const res = await request(app)
      .delete(`/api/subcontracts/${subcontractId}`)
      .set('Authorization', `Bearer ${workerRoleToken}`);

    expect(res.statusCode).toBe(403);
  });
});
