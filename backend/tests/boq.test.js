const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');
const BOQ = require('../models/BOQ');

let engineerToken;

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
    .send({ name: 'BOQ Engineer', email: 'boq-eng@example.com', password: 'password123', role: 'engineer' });
  engineerToken = eng.body.token;
});

describe('BOQ totals and item amounts', () => {
  it('calculates and persists item amount and totalAmount on create', async () => {
    const res = await request(app)
      .post('/api/boq')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        title: 'Initial BOQ',
        items: [
          { description: 'Cement', unit: 'bag', quantity: 2, unitRate: 10, amount: 999 },
          { description: 'Sand', unit: 'm3', quantity: 3, unitRate: 5, amount: 999 },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.boq.items).toHaveLength(2);
    expect(res.body.boq.items[0].amount).toBe(20);
    expect(res.body.boq.items[1].amount).toBe(15);
    expect(res.body.boq.totalAmount).toBe(35);
  });

  it('recalculates and persists item amount and totalAmount on update', async () => {
    const createRes = await request(app)
      .post('/api/boq')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        title: 'BOQ Update Target',
        items: [{ description: 'Blocks', unit: 'pcs', quantity: 1, unitRate: 100 }],
      });

    const boqId = createRes.body.boq._id;

    const updateRes = await request(app)
      .put(`/api/boq/${boqId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        title: 'BOQ Update Target',
        items: [
          { description: 'Blocks', unit: 'pcs', quantity: 2, unitRate: 100, amount: 0 },
          { description: 'Steel', unit: 'kg', quantity: 5, unitRate: 40, amount: 0 },
        ],
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.boq.items[0].amount).toBe(200);
    expect(updateRes.body.boq.items[1].amount).toBe(200);
    expect(updateRes.body.boq.totalAmount).toBe(400);

    const saved = await BOQ.findById(boqId);
    expect(saved.items[0].amount).toBe(200);
    expect(saved.items[1].amount).toBe(200);
    expect(saved.totalAmount).toBe(400);
  });
});
