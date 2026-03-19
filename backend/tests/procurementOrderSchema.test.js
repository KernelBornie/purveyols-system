const mongoose = require('mongoose');
const ProcurementOrder = require('../models/ProcurementOrder');
const { connect, disconnect, clearCollections } = require('./setup');

describe('ProcurementOrder schema', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const validPayload = () => ({
    requestedBy: new mongoose.Types.ObjectId(),
    project: new mongoose.Types.ObjectId(),
    items: [{ name: 'Cement', quantity: 5, unitPrice: 1200 }]
  });

  it('requires project, requestedBy, and at least one item', async () => {
    const order = new ProcurementOrder({
      requestedBy: new mongoose.Types.ObjectId(),
      items: []
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('requires each item to include name, quantity, and unitPrice', async () => {
    const order = new ProcurementOrder({
      requestedBy: new mongoose.Types.ObjectId(),
      project: new mongoose.Types.ObjectId(),
      items: [{ name: 'Cement', quantity: 5 }]
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('defaults status to pending and allows approved/rejected', async () => {
    const pending = await ProcurementOrder.create(validPayload());
    expect(pending.status).toBe('pending');

    pending.status = 'approved';
    await expect(pending.save()).resolves.toBeDefined();

    pending.status = 'rejected';
    await expect(pending.save()).resolves.toBeDefined();
  });

  it('adds timestamps on save', async () => {
    const order = await ProcurementOrder.create(validPayload());

    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
  });
});
