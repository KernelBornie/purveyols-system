const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let accountantToken;
let directorToken;
let engineerToken;
let workerId;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();

  const acc = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Acc User', email: 'acc@example.com', password: 'password123', role: 'accountant' });
  accountantToken = acc.body.token;

  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dir User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;

  const eng = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Eng User', email: 'eng@example.com', password: 'password123', role: 'engineer' });
  engineerToken = eng.body.token;

  // Create a worker to use in payment tests
  const wkrRes = await request(app)
    .post('/api/workers')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      name: 'Pay Worker',
      nrc: '111111/11/1',
      phone: '0977000001',
      dailyRate: 200,
      site: 'Site C',
      mobileNetwork: 'mtn',
      role: 'worker'
    });
  workerId = wkrRes.body._id;
});

describe('POST /api/payments (general)', () => {
  it('accountant can create a general payment', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        paymentType: 'cash',
        recipientName: 'Supplier A',
        amount: 5000,
        description: 'Materials purchase'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.payment).toMatchObject({ recipientName: 'Supplier A', amount: 5000 });
    expect(res.body.message).toMatch(/success/i);
  });

  it('returns 403 when called by an engineer', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        paymentType: 'cash',
        recipientName: 'Someone',
        amount: 100
      });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/payments').send({});
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/payments (worker-based)', () => {
  it('calculates amount from dailyRate * days', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ workerId, days: 5, mobileNetwork: 'mtn' });

    expect(res.statusCode).toBe(201);
    expect(res.body.payment.amount).toBe(1000); // 200 * 5
    expect(['completed', 'failed']).toContain(res.body.payment.status);
    expect(res.body.payment.transactionRef).toMatch(/^MTN-ZM-/);
  });

  it('returns 400 when days is invalid', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ workerId, days: 0 });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when worker does not exist', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ workerId: fakeId, days: 3 });

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/payments', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        paymentType: 'cash',
        recipientName: 'Test Recipient',
        amount: 1000
      });
  });

  it('accountant can list all payments', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('director can list all payments', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('returns 403 for engineer', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/payments/bulk', () => {
  it('pays all active workers for the given number of days', async () => {
    const res = await request(app)
      .post('/api/payments/bulk')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ days: 3, mobileNetwork: 'airtel' });

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.message).toMatch(/paid 1 worker/i);
    expect(typeof res.body.succeeded).toBe('number');
    expect(typeof res.body.failed).toBe('number');
    expect(res.body.succeeded + res.body.failed).toBe(1);
  });

  it('returns 400 when days is invalid', async () => {
    const res = await request(app)
      .post('/api/payments/bulk')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ days: -1 });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when called by a non-accountant', async () => {
    const res = await request(app)
      .post('/api/payments/bulk')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ days: 2 });

    expect(res.statusCode).toBe(403);
  });
});
