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

async function registerAndLogin(overrides = {}) {
  const userData = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'password123',
    role: 'worker',
    ...overrides
  };
  const res = await request(app).post('/api/auth/register').send(userData);
  return res.body.token;
}

describe('POST /api/users', () => {
  it('allows admin to create a new user', async () => {
    const token = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Worker', email: 'newworker@example.com', password: 'password123', role: 'worker' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ email: 'newworker@example.com', role: 'worker', isActive: true });
  });

  it('allows director to create a new user', async () => {
    const token = await registerAndLogin({ role: 'director', email: 'director@example.com' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Engineer', email: 'engineer@example.com', password: 'password123', role: 'engineer' });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('engineer');
  });

  it('returns 403 for non-admin/director users', async () => {
    const token = await registerAndLogin({ role: 'engineer', email: 'eng@example.com' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Worker', email: 'newworker@example.com', password: 'password123' });

    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for duplicate email', async () => {
    const token = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'First', email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second', email: 'dup@example.com', password: 'password123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 for missing required fields', async () => {
    const token = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'incomplete@example.com' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'New User', email: 'new@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/users/:id (soft delete)', () => {
  it('allows admin to soft delete a user', async () => {
    const adminToken = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });

    // Create a user to delete
    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'To Delete', email: 'todelete@example.com', password: 'password123' });

    const userId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
    expect(res.body.user.isActive).toBe(false);
    expect(res.body.user.deletedAt).toBeTruthy();
  });

  it('prevents soft-deleted user from logging in', async () => {
    const adminToken = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });

    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'To Delete', email: 'blocked@example.com', password: 'password123' });

    const userId = createRes.body.id;

    await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'blocked@example.com', password: 'password123' });

    expect(loginRes.statusCode).toBe(403);
  });

  it('returns 400 when trying to delete own account', async () => {
    const adminToken = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });

    // Get own user ID via /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    const adminId = meRes.body.user.id;

    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot delete your own/i);
  });

  it('returns 403 for non-admin/director', async () => {
    const adminToken = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });
    const workerToken = await registerAndLogin({ role: 'worker', email: 'worker@example.com' });

    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Target', email: 'target@example.com', password: 'password123' });

    const userId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for non-existent user', async () => {
    const adminToken = await registerAndLogin({ role: 'admin', email: 'admin@example.com' });

    const res = await request(app)
      .delete('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
