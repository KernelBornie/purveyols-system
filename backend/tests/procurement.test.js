const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./setup');

let engineerToken;
let procurementToken;
let directorToken;
let accountantToken;
let adminToken;
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

  const proc = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Proc User', email: 'proc@example.com', password: 'password123', role: 'procurement' });
  procurementToken = proc.body.token;

  const dir = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dir User', email: 'dir@example.com', password: 'password123', role: 'director' });
  directorToken = dir.body.token;

  const acc = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Acc User', email: 'acc@example.com', password: 'password123', role: 'accountant' });
  accountantToken = acc.body.token;

  const adm = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' });
  adminToken = adm.body.token;

  const wkr = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Wkr User', email: 'wkr@example.com', password: 'password123', role: 'worker' });
  workerToken = wkr.body.token;
});

const orderPayload = {
  items: [
    { name: 'Cement Bags', description: '50kg bags', quantity: 100 }
  ]
};

// Helper: engineer creates an order
const createOrder = async () => {
  const res = await request(app)
    .post('/api/procurement')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send(orderPayload);
  return res.body.order;
};

// Helper: procurement officer sets price
const setPrice = async (id) => {
  const res = await request(app)
    .put(`/api/procurement/${id}/price`)
    .set('Authorization', `Bearer ${procurementToken}`)
    .send({ supplier: 'BuildMart', items: [{ unitPrice: 50 }] });
  return res.body;
};

describe('POST /api/procurement', () => {
  it('engineer can create a procurement request without price', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send(orderPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Procurement order created successfully');
    expect(res.body.order.status).toBe('pending');
    expect(Array.isArray(res.body.order.items)).toBe(true);
    expect(res.body.order.items.length).toBe(1);
    expect(res.body.order.items[0].name).toBe('Cement Bags');
    expect(res.body.order.items[0].quantity).toBe(100);
    expect(res.body.order.items[0].unitPrice).toBeUndefined();
    expect(res.body.order.items[0].totalPrice).toBeUndefined();
  });

  it('calculates total price from multiple items when unit prices are provided', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        items: [
          { name: 'Steel', description: '16mm', quantity: 25, unitPrice: 900 },
          { name: 'Cement', description: '50kg', quantity: 2, unitPrice: 100 }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.items[0].unitPrice).toBe(900);
    expect(res.body.order.items[0].totalPrice).toBe(22500);
    expect(res.body.order.items[1].unitPrice).toBe(100);
    expect(res.body.order.items[1].totalPrice).toBe(200);
    expect(res.body.order.totalPrice).toBe(22700);
  });

  it('returns 400 when an item has no name', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        items: [{ name: ' ', quantity: 2 }]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Each item name is required');
  });

  it('returns 400 when an item quantity is less than 1', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        items: [{ name: 'Steel', quantity: 0 }]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Each item quantity must be at least 1');
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/procurement').send(orderPayload);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when called by a worker', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(orderPayload);
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when called by procurement officer', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${procurementToken}`)
      .send(orderPayload);
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when called by director', async () => {
    const res = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${directorToken}`)
      .send(orderPayload);
    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/procurement/:id/price', () => {
  it('procurement officer can set supplier and price on a pending order', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({ supplier: 'BuildMart', items: [{ unitPrice: 50 }] });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('priced');
    expect(res.body.supplier).toBe('BuildMart');
    expect(res.body.items[0].unitPrice).toBe(50);
    expect(res.body.items[0].totalPrice).toBe(5000);
    expect(res.body.totalPrice).toBe(5000);
    expect(res.body.priceSetBy).toBeDefined();
  });

  it('calculates order total from multiple priced items', async () => {
    const createRes = await request(app)
      .post('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        items: [
          { name: 'Cement Bags', description: '50kg bags', quantity: 100 },
          { name: 'Steel Rods', description: '12mm rods', quantity: 10 }
        ]
      });

    const res = await request(app)
      .put(`/api/procurement/${createRes.body.order._id}/price`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({ supplier: 'BuildMart', items: [{ unitPrice: 50 }, { unitPrice: 120 }] });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('priced');
    expect(res.body.items[0].totalPrice).toBe(5000);
    expect(res.body.items[1].totalPrice).toBe(1200);
    expect(res.body.totalPrice).toBe(6200);
  });

  it('returns 400 if items prices are missing', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({ supplier: 'BuildMart' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if unit price is zero', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({ supplier: 'BuildMart', items: [{ unitPrice: 0 }] });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if order is not in pending status', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({ supplier: 'BuildMart', unitPrice: 60 });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when called by an engineer', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ supplier: 'BuildMart', items: [{ unitPrice: 50 }] });

    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when called by director', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/price`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ supplier: 'BuildMart', items: [{ unitPrice: 50 }] });

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/procurement/:id/approve', () => {
  it('director can approve a priced order', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 'approved',
      approvedByDirector: true
    });
    expect(res.body.approvedBy).toBeDefined();
  });

  it('returns 400 if order is still pending (not priced)', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when called by engineer', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when called by accountant', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/procurement/:id/fund', () => {
  it('accountant can fund a director-approved order', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    const res = await request(app)
      .put(`/api/procurement/${order._id}/fund`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 'funded',
      fundedByAccountant: true
    });
  });

  it('returns 400 if order is not approved by director', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/fund`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if order is still pending', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/fund`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when called by director', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    const res = await request(app)
      .put(`/api/procurement/${order._id}/fund`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when called by engineer', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    await request(app)
      .put(`/api/procurement/${order._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    const res = await request(app)
      .put(`/api/procurement/${order._id}/fund`)
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/procurement/:id', () => {
  it('admin can update order details while ignoring unitPrice updates', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ name: 'Updated Cement', description: 'Updated', quantity: 120, unitPrice: 99 }]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].name).toBe('Updated Cement');
    expect(res.body.items[0].unitPrice).toBeUndefined();
    expect(res.body.totalPrice).toBeUndefined();
  });

  it('returns 403 when procurement officer tries to update order', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}`)
      .set('Authorization', `Bearer ${procurementToken}`)
      .send({
        items: [{ name: 'Attempted Edit', quantity: 10 }]
      });

    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when engineer tries to update order', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        items: [{ name: 'Attempted Edit', quantity: 10 }]
      });

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/procurement/:id/reject', () => {
  it('director can reject a priced order', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: 'Budget exceeded' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: 'rejected', rejectionReason: 'Budget exceeded' });
  });

  it('returns 400 when trying to reject a pending order', async () => {
    const order = await createOrder();
    const res = await request(app)
      .put(`/api/procurement/${order._id}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: 'Not needed' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when called by engineer', async () => {
    const order = await createOrder();
    await setPrice(order._id);
    const res = await request(app)
      .put(`/api/procurement/${order._id}/reject`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ rejectionReason: 'Test' });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/procurement', () => {
  it('returns all procurement orders', async () => {
    await createOrder();
    const res = await request(app)
      .get('/api/procurement')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/procurement');
    expect(res.statusCode).toBe(401);
  });
});
