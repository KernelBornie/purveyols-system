import api from '../api/axios';
import {
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  putRecords,
  getStore,
  getAuth
} from './persistentStore';

// ─── Endpoint mappings ──────────────────────────────────────
const ENDPOINT_MAP = {
  workers: { url: '/api/workers', store: 'workers', saveFn: putRecords },
  projects: { url: '/api/projects', store: 'projects', saveFn: putRecords },
  funding: { url: '/api/funding-requests', store: 'funding', saveFn: putRecords },
  payments: { url: '/api/payments', store: 'payments', saveFn: putRecords },
  procurement: { url: '/api/procurement', store: 'procurement', saveFn: putRecords },
  boqs: { url: '/api/boq', store: 'boqs', saveFn: putRecords },
  subcontracts: { url: '/api/subcontracts', store: 'subcontracts', saveFn: putRecords },
  notifications: { url: '/api/notifications', store: 'notifications', saveFn: putRecords },
  delivery: { url: '/api/delivery', store: 'delivery', saveFn: putRecords },
  sitePlans: { url: '/api/site-plans', store: 'sitePlans', saveFn: putRecords },
  surveys: { url: '/api/surveys', store: 'surveys', saveFn: putRecords },
  safetyReports: { url: '/api/safety-reports', store: 'safetyReports', saveFn: putRecords },
  spareParts: { url: '/api/spare-parts', store: 'spareParts', saveFn: putRecords },
};

// ─── Sync all data from API to persistent storage ──────────
export const syncAllData = async () => {
  if (!navigator.onLine) {
    console.warn('⚠️ Offline – skipping sync');
    return { success: false, offline: true };
  }

  const results = {};
  const endpoints = Object.keys(ENDPOINT_MAP);

  for (const key of endpoints) {
    const config = ENDPOINT_MAP[key];
    try {
      const res = await api.get(config.url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (data.length > 0) {
        await config.saveFn(config.store, data);
      }
      results[key] = { success: true, count: data.length };
    } catch (err) {
      console.warn(`Failed to sync ${key}:`, err.message);
      // Try to load from offline store as fallback
      try {
        const offlineData = await getStore(config.store);
        results[key] = { success: true, count: offlineData.length, offline: true };
      } catch {
        results[key] = { success: false, error: err.message };
      }
    }
  }

  return results;
};

// ─── Sync a single operation from queue ────────────────────
const syncOperation = async (item) => {
  const { operation } = item;
  try {
    const { method, url, data, id } = operation;

    let fullUrl = url;
    if (id && (method === 'PUT' || method === 'DELETE')) {
      fullUrl = `${url}/${id}`;
    }

    const response = await api.request({
      method,
      url: fullUrl,
      data: data
    });

    await removeFromSyncQueue(item.id);
    return { success: true, response: response.data };
  } catch (err) {
    item.retries = (item.retries || 0) + 1;
    // If retries > 5, keep in queue but mark for review
    if (item.retries >= 5) {
      console.error('Sync failed permanently for:', item.operation);
    }
    return { success: false, error: err };
  }
};

// ─── Sync all pending operations ──────────────────────────
export const syncPendingOperations = async () => {
  if (!navigator.onLine) {
    console.warn('⚠️ Offline – skipping queue sync');
    return;
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  console.log(`🔄 Syncing ${queue.length} pending operations...`);

  for (const item of queue) {
    const result = await syncOperation(item);
    if (!result.success && item.retries < 5) {
      // Keep in queue for retry
      console.warn('Sync failed, will retry later:', item.operation);
    }
  }
};

// ─── Get all persistent data (from IndexedDB) ─────────────
export const getAllPersistentData = async () => {
  const results = {};
  const endpoints = Object.keys(ENDPOINT_MAP);
  for (const key of endpoints) {
    const config = ENDPOINT_MAP[key];
    try {
      results[key] = await getStore(config.store);
    } catch {
      results[key] = [];
    }
  }
  return results;
};

// ─── Check if we have any persistent data ──────────────────
export const hasPersistentData = async () => {
  const data = await getAllPersistentData();
  return Object.values(data).some(arr => arr && arr.length > 0);
};

// ─── Force refresh all data ──────────────────────────────────
export const refreshAllData = async () => {
  const results = await syncAllData();
  return await getAllPersistentData();
};

// ─── Register sync listeners ──────────────────────────────────
export const initSync = () => {
  // Sync when coming online
  window.addEventListener('online', () => {
    console.log('🔄 Network back – syncing...');
    setTimeout(() => {
      syncAllData();
      syncPendingOperations();
    }, 1000);
  });

  // Sync every 5 minutes when online
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingOperations();
    }
  }, 5 * 60 * 1000);

  // Initial sync on app load
  if (navigator.onLine) {
    setTimeout(() => {
      syncAllData();
      syncPendingOperations();
    }, 3000);
  }
};

export default {
  syncAllData,
  syncPendingOperations,
  getAllPersistentData,
  hasPersistentData,
  refreshAllData,
  initSync,
  ENDPOINT_MAP,
};
