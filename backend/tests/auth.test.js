const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'test@example.com', role: 'worker' });
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when email is already registered', async () => {
    const userData = { name: 'Duplicate', email: 'dup@example.com', password: 'password123' };
    await request(app).post('/api/auth/register').send(userData);

    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'password123' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a password that is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short Pass', email: 'short@example.com', password: '123' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login Test', email: 'login@example.com', password: 'password123', role: 'engineer' });
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'login@example.com', role: 'engineer' });
  });

  it('returns 400 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 400 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/auth/change-password', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Change Pass', email: 'changepass@example.com', password: 'oldpassword123' });
    token = res.body.token;
  });

  it('changes password with correct old password', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'oldpassword123', newPassword: 'newpassword456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/password changed/i);
  });

  it('returns 400 for incorrect old password', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrongpassword', newPassword: 'newpassword456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/old password is incorrect/i);
  });

  it('returns 400 if new password is too short', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'oldpassword123', newPassword: '123' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .send({ oldPassword: 'oldpassword123', newPassword: 'newpassword456' });

    expect(res.statusCode).toBe(401);
  });

  it('allows login with new password after change', async () => {
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'oldpassword123', newPassword: 'newpassword456' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'changepass@example.com', password: 'newpassword456' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Me User', email: 'me@example.com', password: 'password123', role: 'accountant' });
    token = res.body.token;
  });

  it('returns the authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'me@example.com', role: 'accountant' });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});
