// IndexedDB utility for offline-first functionality
const DB_NAME = 'purveyols_offline';
const DB_VERSION = 1;

const STORES = {
  workers: 'workers',
  payments: 'payments',
  fundingRequests: 'fundingRequests',
  materialRequests: 'materialRequests',
  logbooks: 'logbooks',
  safetyReports: 'safetyReports',
  pendingSync: 'pendingSync',
};

let db;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: '_id' });
        }
      });
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveToStore = async (storeName, data) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const items = Array.isArray(data) ? data : [data];
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getFromStore = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveForSync = async (action) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.pendingSync, 'readwrite');
    const store = tx.objectStore(STORES.pendingSync);
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    store.put({ _id: id, ...action, timestamp: new Date().toISOString() });
    tx.oncomplete = () => resolve(id);
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingSync = async () => {
  return getFromStore(STORES.pendingSync);
};

export const removeSyncItem = async (id) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.pendingSync, 'readwrite');
    const store = tx.objectStore(STORES.pendingSync);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export { STORES };
