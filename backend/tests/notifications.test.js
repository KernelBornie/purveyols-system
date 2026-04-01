const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let userToken;
let userId;
let directorToken;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();

  const user = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Engineer User', email: 'eng@example.com', password: 'password123', role: 'engineer' });
  userToken = user.body.token;
  userId = user.body.user.id;

  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Director User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;
});

describe('GET /api/notifications', () => {
  it('returns empty notifications for a new user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
    expect(res.body.unreadCount).toBe(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
  });

  it('creates a notification when a funding request is submitted', async () => {
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Funding', description: 'Some materials', amount: 5000 });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    expect(res.body.notifications[0].type).toBe('funding_request');
    expect(res.body.unreadCount).toBe(1);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  it('marks a notification as read', async () => {
    // Create a notification via funding request
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Funding', description: 'Some materials', amount: 5000 });

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    const notifId = listRes.body.notifications[0]._id;

    const readRes = await request(app)
      .put(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(readRes.statusCode).toBe(200);
    expect(readRes.body.isRead).toBe(true);

    const afterRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterRes.body.unreadCount).toBe(0);
  });

  it('returns 404 for a notification belonging to another user', async () => {
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Funding', description: 'Some materials', amount: 5000 });

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    const notifId = listRes.body.notifications[0]._id;

    const res = await request(app)
      .put(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/notifications/read-all', () => {
  it('marks all notifications as read', async () => {
    // Create multiple notifications
    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Funding 1', description: 'Desc 1', amount: 1000 });

    await request(app)
      .post('/api/funding-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Funding 2', description: 'Desc 2', amount: 2000 });

    const readAllRes = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(readAllRes.statusCode).toBe(200);

    const afterRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterRes.body.unreadCount).toBe(0);
    expect(afterRes.body.notifications.every((n) => n.isRead)).toBe(true);
  });
});
