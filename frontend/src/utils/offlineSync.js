import localforage from 'localforage';
import api from '../api/axios';

// Configure local storage for offline data
const offlineStore = localforage.createInstance({
  name: 'PurveyolsOffline',
  storeName: 'syncQueue',
});

// Queue an operation for sync when online
export const queueSync = async (operation, data) => {
  const queue = (await offlineStore.getItem('syncQueue')) || [];
  queue.push({ operation, data, timestamp: new Date().toISOString() });
  await offlineStore.setItem('syncQueue', queue);
  console.log('📦 Queued for sync:', operation, data);
};

// Process sync queue when online
export const processSyncQueue = async () => {
  const queue = (await offlineStore.getItem('syncQueue')) || [];
  if (queue.length === 0) return;

  console.log(`🔄 Processing ${queue.length} queued operations...`);
  
  const results = [];
  const failed = [];

  for (const item of queue) {
    try {
      let response;
      switch (item.operation) {
        case 'create-worker':
          response = await api.post('/api/workers', item.data);
          break;
        case 'create-project':
          response = await api.post('/api/projects', item.data);
          break;
        case 'create-funding':
          response = await api.post('/api/funding-requests', item.data);
          break;
        case 'create-procurement':
          response = await api.post('/api/procurement', item.data);
          break;
        case 'create-payment':
          response = await api.post('/api/payments', item.data);
          break;
        default:
          console.warn('Unknown operation:', item.operation);
          continue;
      }
      results.push({ item, response: response.data });
      console.log(`✅ Synced: ${item.operation}`);
    } catch (err) {
      failed.push({ item, error: err.message });
      console.error(`❌ Failed to sync: ${item.operation}`, err.message);
    }
  }

  // Keep failed items in queue
  const remaining = queue.filter((_, index) => failed.some(f => f.item === queue[index]));
  await offlineStore.setItem('syncQueue', remaining);
  
  console.log(`✅ Sync complete: ${results.length} succeeded, ${failed.length} failed`);
  return { results, failed };
};

// Get sync status
export const getSyncStatus = async () => {
  const queue = (await offlineStore.getItem('syncQueue')) || [];
  return {
    pending: queue.length,
    queue,
  };
};

// Clear sync queue
export const clearSyncQueue = async () => {
  await offlineStore.setItem('syncQueue', []);
  console.log('🗑️ Sync queue cleared');
};

// Check if online and process
export const checkAndSync = async () => {
  if (navigator.onLine) {
    await processSyncQueue();
  }
};

// Add online/offline listeners
export const initOfflineSync = () => {
  // Process queue when coming online
  window.addEventListener('online', async () => {
    console.log('🌐 Online detected - syncing...');
    await processSyncQueue();
  });

  // Check on load
  document.addEventListener('DOMContentLoaded', async () => {
    const status = await getSyncStatus();
    if (status.pending > 0 && navigator.onLine) {
      await processSyncQueue();
    }
  });

  // Periodic check (every 2 minutes)
  setInterval(async () => {
    if (navigator.onLine) {
      const status = await getSyncStatus();
      if (status.pending > 0) {
        await processSyncQueue();
      }
    }
  }, 120000);

  console.log('🔁 Offline sync initialized');
};

export default {
  queueSync,
  processSyncQueue,
  getSyncStatus,
  clearSyncQueue,
  checkAndSync,
  initOfflineSync,
};
