import { openDB } from 'idb';

const DB_NAME = 'PurveyolsDB';
const DB_VERSION = 3;

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // ─── Auth store ──────────────────────────────────
    if (!db.objectStoreNames.contains('auth')) {
      db.createObjectStore('auth', { keyPath: 'key' });
    }

    // ─── Workers ─────────────────────────────────────
    if (!db.objectStoreNames.contains('workers')) {
      db.createObjectStore('workers', { keyPath: '_id' });
    }

    // ─── Projects ────────────────────────────────────
    if (!db.objectStoreNames.contains('projects')) {
      db.createObjectStore('projects', { keyPath: '_id' });
    }

    // ─── Funding ─────────────────────────────────────
    if (!db.objectStoreNames.contains('funding')) {
      db.createObjectStore('funding', { keyPath: '_id' });
    }

    // ─── Payments ────────────────────────────────────
    if (!db.objectStoreNames.contains('payments')) {
      db.createObjectStore('payments', { keyPath: '_id' });
    }

    // ─── Procurement ─────────────────────────────────
    if (!db.objectStoreNames.contains('procurement')) {
      db.createObjectStore('procurement', { keyPath: '_id' });
    }

    // ─── BOQs ────────────────────────────────────────
    if (!db.objectStoreNames.contains('boqs')) {
      db.createObjectStore('boqs', { keyPath: '_id' });
    }

    // ─── Subcontracts ────────────────────────────────
    if (!db.objectStoreNames.contains('subcontracts')) {
      db.createObjectStore('subcontracts', { keyPath: '_id' });
    }

    // ─── Notifications ───────────────────────────────
    if (!db.objectStoreNames.contains('notifications')) {
      db.createObjectStore('notifications', { keyPath: '_id' });
    }

    // ─── Delivery Notes ──────────────────────────────
    if (!db.objectStoreNames.contains('delivery')) {
      db.createObjectStore('delivery', { keyPath: '_id' });
    }

    // ─── Site Plans ──────────────────────────────────
    if (!db.objectStoreNames.contains('sitePlans')) {
      const store = db.createObjectStore('sitePlans', { keyPath: '_id' });
      store.createIndex('project', 'project');
      store.createIndex('status', 'status');
    }

    // ─── Surveys ─────────────────────────────────────
    if (!db.objectStoreNames.contains('surveys')) {
      const store = db.createObjectStore('surveys', { keyPath: '_id' });
      store.createIndex('project', 'project');
      store.createIndex('status', 'status');
    }

    // ─── Drawings ────────────────────────────────────
    if (!db.objectStoreNames.contains('drawings')) {
      db.createObjectStore('drawings', { keyPath: 'id' });
    }

    // ─── Sync Queue ──────────────────────────────────
    if (!db.objectStoreNames.contains('syncQueue')) {
      db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    }

    // ─── Safety Reports ──────────────────────────────
    if (!db.objectStoreNames.contains('safetyReports')) {
      db.createObjectStore('safetyReports', { keyPath: '_id' });
    }

    // ─── Spare Parts ─────────────────────────────────
    if (!db.objectStoreNames.contains('spareParts')) {
      db.createObjectStore('spareParts', { keyPath: '_id' });
    }
  }
});

// ─── Generic store operations ──────────────────────────────
export const getStore = async (storeName) => {
  const db = await dbPromise;
  return await db.getAll(storeName);
};

export const getRecord = async (storeName, key) => {
  const db = await dbPromise;
  return await db.get(storeName, key);
};

export const putRecord = async (storeName, record) => {
  const db = await dbPromise;
  await db.put(storeName, record);
};

export const putRecords = async (storeName, records) => {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  for (const record of records) {
    await tx.store.put(record);
  }
  await tx.done;
};

export const deleteRecord = async (storeName, key) => {
  const db = await dbPromise;
  await db.delete(storeName, key);
};

export const clearStore = async (storeName) => {
  const db = await dbPromise;
  await db.clear(storeName);
};

// ─── Auth helpers ──────────────────────────────────────────
export const saveAuth = async (key, value) => {
  const db = await dbPromise;
  await db.put('auth', { key, value });
};

export const getAuth = async (key) => {
  const db = await dbPromise;
  const record = await db.get('auth', key);
  return record ? record.value : null;
};

export const clearAuth = async () => {
  const db = await dbPromise;
  await db.clear('auth');
};

// ─── Sync Queue ────────────────────────────────────────────
export const addToSyncQueue = async (operation) => {
  const db = await dbPromise;
  await db.add('syncQueue', {
    operation,
    timestamp: Date.now(),
    retries: 0
  });
};

export const getSyncQueue = async () => {
  const db = await dbPromise;
  return await db.getAll('syncQueue');
};

export const removeFromSyncQueue = async (id) => {
  const db = await dbPromise;
  await db.delete('syncQueue', id);
};

export const clearSyncQueue = async () => {
  const db = await dbPromise;
  await db.clear('syncQueue');
};

// ─── Drawings ──────────────────────────────────────────────
export const saveDrawing = async (id, data) => {
  const db = await dbPromise;
  await db.put('drawings', { id, data, updatedAt: Date.now() });
};

export const getDrawing = async (id) => {
  const db = await dbPromise;
  const record = await db.get('drawings', id);
  return record ? record.data : null;
};

export const getAllDrawings = async () => {
  const db = await dbPromise;
  return await db.getAll('drawings');
};

export const deleteDrawing = async (id) => {
  const db = await dbPromise;
  await db.delete('drawings', id);
};

// ─── Store‑specific getters/setters ──────────────────────
export const getWorkers = () => getStore('workers');
export const saveWorkers = (data) => putRecords('workers', data);

export const getProjects = () => getStore('projects');
export const saveProjects = (data) => putRecords('projects', data);

export const getFundingRequests = () => getStore('funding');
export const saveFundingRequests = (data) => putRecords('funding', data);

export const getPayments = () => getStore('payments');
export const savePayments = (data) => putRecords('payments', data);

export const getProcurementOrders = () => getStore('procurement');
export const saveProcurementOrders = (data) => putRecords('procurement', data);

export const getBOQs = () => getStore('boqs');
export const saveBOQs = (data) => putRecords('boqs', data);

export const getSubcontracts = () => getStore('subcontracts');
export const saveSubcontracts = (data) => putRecords('subcontracts', data);

export const getNotifications = () => getStore('notifications');
export const saveNotifications = (data) => putRecords('notifications', data);

export const getDeliveryNotes = () => getStore('delivery');
export const saveDeliveryNotes = (data) => putRecords('delivery', data);

export const getSitePlans = () => getStore('sitePlans');
export const saveSitePlans = (data) => putRecords('sitePlans', data);

export const getSurveys = () => getStore('surveys');
export const saveSurveys = (data) => putRecords('surveys', data);

export const getSafetyReports = () => getStore('safetyReports');
export const saveSafetyReports = (data) => putRecords('safetyReports', data);

export const getSpareParts = () => getStore('spareParts');
export const saveSpareParts = (data) => putRecords('spareParts', data);

export default {
  dbPromise,
  getStore,
  getRecord,
  putRecord,
  putRecords,
  deleteRecord,
  clearStore,
  saveAuth,
  getAuth,
  clearAuth,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  saveDrawing,
  getDrawing,
  getAllDrawings,
  deleteDrawing,
  getWorkers,
  saveWorkers,
  getProjects,
  saveProjects,
  getFundingRequests,
  saveFundingRequests,
  getPayments,
  savePayments,
  getProcurementOrders,
  saveProcurementOrders,
  getBOQs,
  saveBOQs,
  getSubcontracts,
  saveSubcontracts,
  getNotifications,
  saveNotifications,
  getDeliveryNotes,
  saveDeliveryNotes,
  getSitePlans,
  saveSitePlans,
  getSurveys,
  saveSurveys,
  getSafetyReports,
  saveSafetyReports,
  getSpareParts,
  saveSpareParts,
};
