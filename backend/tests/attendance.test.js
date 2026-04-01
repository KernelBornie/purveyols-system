const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let foremanToken;
let workerId;

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

  const foreman = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Foreman User', email: 'foreman@example.com', password: 'password123', role: 'foreman' });
  foremanToken = foreman.body.token;

  const wkrRes = await request(app)
    .post('/api/workers')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      name: 'Attendance Worker',
      nrc: '999999/99/9',
      phone: '0977999999',
      dailyRate: 200,
      site: 'Site A',
      mobileNetwork: 'airtel',
      role: 'worker'
    });
  workerId = wkrRes.body._id;
});

const today = () => new Date().toISOString().slice(0, 10);

describe('POST /api/attendance/mark', () => {
  it('marks attendance as present for a worker', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today(), status: 'present', overtimeHours: 2, overtimeRate: 50 });

    expect(res.statusCode).toBe(201);
    expect(res.body.attendance).toMatchObject({ status: 'present', overtimeHours: 2, overtimeRate: 50 });
    expect(res.body.attendance.worker).toMatchObject({ name: 'Attendance Worker' });
  });

  it('marks attendance as absent for a worker', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${foremanToken}`)
      .send({ workerId, date: today(), status: 'absent' });

    expect(res.statusCode).toBe(201);
    expect(res.body.attendance.status).toBe('absent');
  });

  it('upserts – updating an existing record for the same worker and date', async () => {
    await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today(), status: 'absent' });

    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today(), status: 'present', overtimeHours: 1, overtimeRate: 30 });

    expect(res.statusCode).toBe(201);
    expect(res.body.attendance.status).toBe('present');
    expect(res.body.attendance.overtimeHours).toBe(1);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today() }); // missing status

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today(), status: 'late' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when worker does not exist', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId: fakeId, date: today(), status: 'present' });

    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .send({ workerId, date: today(), status: 'present' });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/attendance/worker/:id', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ workerId, date: today(), status: 'present', overtimeHours: 3, overtimeRate: 40 });
  });

  it('returns attendance records for a worker', async () => {
    const res = await request(app)
      .get(`/api/attendance/worker/${workerId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('attendance');
    expect(res.body.attendance).toHaveLength(1);
    expect(res.body.attendance[0]).toMatchObject({ status: 'present', overtimeHours: 3, overtimeRate: 40 });
  });

  it('returns 404 for a non-existent worker', async () => {
    const fakeId = '64a000000000000000000001';
    const res = await request(app)
      .get(`/api/attendance/worker/${fakeId}`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/attendance/worker/${workerId}`);
    expect(res.statusCode).toBe(401);
  });
});
