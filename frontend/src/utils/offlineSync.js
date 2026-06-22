// ─── Offline Sync Queue Manager ──────────────────────────────
const STORAGE_KEY = 'offlineQueue';
const RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

let isProcessing = false;
let syncInterval = null;

/**
 * Get the current sync queue from localStorage
 */
const getQueue = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save the sync queue to localStorage
 */
const saveQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to save sync queue:', e);
  }
};

/**
 * Add an offline request to the queue
 * @param {object} request - { method, url, data, headers, timestamp, retries }
 */
export const enqueueRequest = (request) => {
  const queue = getQueue();
  queue.push({
    ...request,
    timestamp: Date.now(),
    retries: 0,
  });
  saveQueue(queue);
  console.log(`📦 Request queued for offline sync: ${request.method} ${request.url}`);
};

/**
 * Process the sync queue – replay all pending requests
 * @param {function} apiCall - function to execute the request (e.g., axios instance)
 * @returns {Promise<{ success: number, failed: number }>}
 */
export const processQueue = async (apiCall) => {
  if (isProcessing) return;
  const queue = getQueue();
  if (queue.length === 0) return;

  isProcessing = true;
  console.log(`🔄 Processing ${queue.length} queued requests...`);

  let success = 0;
  let failed = 0;
  const newQueue = [];

  for (const request of queue) {
    try {
      await apiCall({
        method: request.method,
        url: request.url,
        data: request.data,
        headers: request.headers || {},
      });
      success++;
      console.log(`✅ Replayed: ${request.method} ${request.url}`);
    } catch (error) {
      request.retries = (request.retries || 0) + 1;
      if (request.retries < MAX_RETRIES) {
        newQueue.push(request);
        console.warn(`⏳ Retry ${request.retries}/${MAX_RETRIES}: ${request.method} ${request.url}`);
      } else {
        failed++;
        console.error(`❌ Failed permanently: ${request.method} ${request.url}`, error);
        // Optionally notify user of permanent failure
      }
    }
  }

  saveQueue(newQueue);
  isProcessing = false;
  console.log(`✅ Sync complete: ${success} succeeded, ${failed} failed, ${newQueue.length} remaining`);

  // If there are still items, schedule another attempt
  if (newQueue.length > 0 && !syncInterval) {
    syncInterval = setInterval(() => processQueue(apiCall), RETRY_DELAY);
  } else if (newQueue.length === 0 && syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  return { success, failed, remaining: newQueue.length };
};

/**
 * Check if there are pending items in the queue
 */
export const hasPending = () => {
  return getQueue().length > 0;
};

/**
 * Clear the queue (e.g., on logout)
 */
export const clearQueue = () => {
  saveQueue([]);
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  console.log('🧹 Offline sync queue cleared');
};

/**
 * Get the current sync status (pending count)
 */
export const getSyncStatus = async () => {
  const queue = getQueue();
  return { pending: queue.length, queue };
};

/**
 * Init offline sync – set up online/offline listeners
 * @param {function} apiCall - the axios instance to use for replay
 */
export const initOfflineSync = (apiCall) => {
  // Listen for online events
  const handleOnline = () => {
    console.log('🌐 Online - checking sync queue...');
    processQueue(apiCall);
  };

  const handleOffline = () => {
    console.log('📴 Offline - requests will be queued');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // If we're already online, process queue immediately
  if (navigator.onLine) {
    setTimeout(() => processQueue(apiCall), 1000);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
};

export default {
  enqueueRequest,
  processQueue,
  hasPending,
  clearQueue,
  getSyncStatus,
  initOfflineSync,
};
