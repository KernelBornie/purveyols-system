import * as PersistentStore from './persistentStore';
import api from '../api/axios';

// Sync all data from API to persistent storage
export const syncAllData = async () => {
  const endpoints = [
    { key: 'workers', url: '/api/workers' },
    { key: 'projects', url: '/api/projects' },
    { key: 'funding', url: '/api/funding-requests' },
    { key: 'payments', url: '/api/payments' },
    { key: 'procurement', url: '/api/procurement' },
    { key: 'boqs', url: '/api/boq' },
    { key: 'subcontracts', url: '/api/subcontracts' },
    { key: 'notifications', url: '/api/notifications' },
  ];

  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const res = await api.get(endpoint.url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Save to persistent store
      const saveFn = PersistentStore[`save${endpoint.key.charAt(0).toUpperCase() + endpoint.key.slice(1)}`];
      if (saveFn) {
        saveFn(data);
        results[endpoint.key] = { success: true, count: data.length };
      }
    } catch (err) {
      console.warn(`Failed to sync ${endpoint.key}:`, err.message);
      results[endpoint.key] = { success: false, error: err.message };
    }
  }
  
  return results;
};

// Get all data from persistent storage (with fallback to API if needed)
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
  };
};

// Check if we have data in persistent storage
export const hasPersistentData = () => {
  const data = getAllPersistentData();
  return Object.values(data).some(arr => arr && arr.length > 0);
};

// Force refresh all data from API
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
