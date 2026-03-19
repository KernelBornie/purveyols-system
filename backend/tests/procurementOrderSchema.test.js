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

  it('requires requestedBy and at least one item', async () => {
    const order = new ProcurementOrder({
      requestedBy: new mongoose.Types.ObjectId(),
      items: []
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('requires each item to include name and quantity', async () => {
    const order = new ProcurementOrder({
      requestedBy: new mongoose.Types.ObjectId(),
      project: new mongoose.Types.ObjectId(),
      items: [{ name: 'Cement', quantity: 5 }]
    });

    await expect(order.validate()).resolves.toBeUndefined();
  });

  it('defaults status to pending and allows priced/approved/funded/rejected', async () => {
    const pending = await ProcurementOrder.create(validPayload());
    expect(pending.status).toBe('pending');

    pending.status = 'priced';
    await expect(pending.save()).resolves.toBeDefined();

    pending.status = 'approved';
    await expect(pending.save()).resolves.toBeDefined();

    pending.status = 'funded';
    await expect(pending.save()).resolves.toBeDefined();

    pending.status = 'rejected';
    await expect(pending.save()).resolves.toBeDefined();
  });

  it('calculates item and order totals when all items have unitPrice', async () => {
    const order = await ProcurementOrder.create({
      requestedBy: new mongoose.Types.ObjectId(),
      items: [
        { name: 'Cement', quantity: 5, unitPrice: 10 },
        { name: 'Steel', quantity: 3, unitPrice: 20 }
      ]
    });

    expect(order.items[0].totalPrice).toBe(50);
    expect(order.items[1].totalPrice).toBe(60);
    expect(order.totalPrice).toBe(110);
  });

  it('leaves order total undefined when any item lacks unitPrice', async () => {
    const order = await ProcurementOrder.create({
      requestedBy: new mongoose.Types.ObjectId(),
      items: [
        { name: 'Cement', quantity: 5, unitPrice: 10 },
        { name: 'Steel', quantity: 3 }
      ]
    });

    expect(order.items[0].totalPrice).toBe(50);
    expect(order.items[1].totalPrice).toBeUndefined();
    expect(order.totalPrice).toBeUndefined();
  });

  it('adds timestamps on save', async () => {
    const order = await ProcurementOrder.create(validPayload());

    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
  });
});
