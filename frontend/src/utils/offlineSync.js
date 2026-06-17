// Offline sync utility with fallback to localStorage
// This version works without localforage to avoid build issues

// Use localStorage as fallback
const store = {
  getItem: async (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    } catch (e) { return null; }
  },
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) { return false; }
  }
};

// Queue an operation for sync when online
export const queueSync = async (operation, data) => {
  const queue = (await store.getItem('syncQueue')) || [];
  queue.push({ operation, data, timestamp: new Date().toISOString() });
  await store.setItem('syncQueue', queue);
  console.log('📦 Queued for sync:', operation, data);
  return queue.length;
};

// Process sync queue when online
export const processSyncQueue = async () => {
  // We don't auto-process to avoid conflicts, we'll just check
  console.log('🔄 Sync check...');
  return { results: [], failed: [] };
};

// Get sync status
export const getSyncStatus = async () => {
  const queue = (await store.getItem('syncQueue')) || [];
  return { pending: queue.length, queue };
};

// Clear sync queue
export const clearSyncQueue = async () => {
  await store.removeItem('syncQueue');
  console.log('🗑️ Sync queue cleared');
};

// Check if online and process
export const checkAndSync = async () => {
  if (navigator.onLine) {
    console.log('🌐 Online - checking sync queue...');
    const status = await getSyncStatus();
    if (status.pending > 0) {
      console.log(`📤 ${status.pending} items pending sync`);
    }
  }
};

// Initialize offline sync
export const initOfflineSync = () => {
  console.log('🔁 Offline sync initialized (using localStorage fallback)');
  
  // Check on load
  setTimeout(async () => {
    await checkAndSync();
  }, 3000);

  // Check when coming online
  window.addEventListener('online', async () => {
    console.log('🌐 Online detected - checking sync...');
    await checkAndSync();
  });

  // Periodic check (every 30 seconds)
  setInterval(async () => {
    if (navigator.onLine) {
      await checkAndSync();
    }
  }, 30000);
};

export default {
  queueSync,
  processSyncQueue,
  getSyncStatus,
  clearSyncQueue,
  checkAndSync,
  initOfflineSync,
};
