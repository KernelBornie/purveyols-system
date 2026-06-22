import * as PersistentStore from './persistentStore';
import api from '../api/axios';

// ─── Sync all data from API to persistent storage ──────────
export const syncAllData = async () => {
  const endpoints = [
    { key: 'workers', url: '/api/workers', saveFn: PersistentStore.saveWorkers },
    { key: 'projects', url: '/api/projects', saveFn: PersistentStore.saveProjects },
    { key: 'funding', url: '/api/funding-requests', saveFn: PersistentStore.saveFundingRequests },
    { key: 'payments', url: '/api/payments', saveFn: PersistentStore.savePayments },
    { key: 'procurement', url: '/api/procurement', saveFn: PersistentStore.saveProcurementOrders },
    { key: 'boqs', url: '/api/boq', saveFn: PersistentStore.saveBOQs },
    { key: 'subcontracts', url: '/api/subcontracts', saveFn: PersistentStore.saveSubcontracts },
    { key: 'notifications', url: '/api/notifications', saveFn: PersistentStore.saveNotifications },
    { key: 'delivery', url: '/api/delivery', saveFn: PersistentStore.saveDeliveryNotes },
  ];

  const results = {};

  for (const endpoint of endpoints) {
    try {
      const res = await api.get(endpoint.url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      endpoint.saveFn(data);
      results[endpoint.key] = { success: true, count: data.length };
    } catch (err) {
      // If offline, just log; data might already be cached
      console.warn(`Failed to sync ${endpoint.key}:`, err.message);
      results[endpoint.key] = { success: false, error: err.message };
    }
  }

  return results;
};

// ─── Get all persistent data (from localStorage) ────────────
export const getAllPersistentData = () => {
  return {
    workers: PersistentStore.getWorkers(),
    projects: PersistentStore.getProjects(),
    funding: PersistentStore.getFundingRequests(),
    payments: PersistentStore.getPayments(),
    procurement: PersistentStore.getProcurementOrders(),
    boqs: PersistentStore.getBOQs(),
    subcontracts: PersistentStore.getSubcontracts(),
    notifications: PersistentStore.getNotifications(),
    delivery: PersistentStore.getDeliveryNotes(),
  };
};

// ─── Check if we have any persistent data ──────────────────
export const hasPersistentData = () => {
  const data = getAllPersistentData();
  return Object.values(data).some(arr => arr && arr.length > 0);
};

// ─── Force refresh all data ──────────────────────────────────
export const refreshAllData = async () => {
  await syncAllData();
  return getAllPersistentData();
};

export default {
  syncAllData,
  getAllPersistentData,
  hasPersistentData,
  refreshAllData,
};
