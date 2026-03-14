const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let directorToken;
let accountantToken;
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

  const acc = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Acc User', email: 'acc@example.com', password: 'password123', role: 'accountant' });
  accountantToken = acc.body.token;

  const wkr = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Wkr User', email: 'wkr@example.com', password: 'password123', role: 'worker' });
  workerToken = wkr.body.token;
});

describe('GET /api/reports/summary', () => {
  it('returns zeros when there is no data', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workers).toMatchObject({ total: 0, active: 0 });
    expect(res.body.projects).toMatchObject({ total: 0 });
    expect(res.body.fundingRequests).toMatchObject({ pending: 0 });
    expect(res.body.payments).toMatchObject({ totalAmount: 0, count: 0 });
    expect(res.body.safetyReports).toMatchObject({ open: 0 });
    expect(res.body.materialRequests).toMatchObject({ pending: 0 });
  });

  it('reflects counts after data is created', async () => {
    // Enroll a worker
    await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        name: 'Report Worker',
        nrc: '222222/22/2',
        phone: '0977000002',
        dailyRate: 150,
        site: 'Site D',
        mobileNetwork: 'airtel',
        role: 'worker'
      });

    // Create a funding request
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        title: 'Cement Purchase',
        description: 'Needed for foundation',
        amount: 10000,
        site: 'Site D',
        priority: 'high'
      });

    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workers.total).toBe(1);
    expect(res.body.workers.active).toBe(1);
    expect(res.body.fundingRequests.pending).toBe(1);
  });

  it('accountant can access the summary', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('engineer can access the summary', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('returns 403 for a worker-role user', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${workerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/reports/summary');
    expect(res.statusCode).toBe(401);
  });
});
