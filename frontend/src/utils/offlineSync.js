// ─── Offline Sync Queue Manager (IndexedDB-backed) ──────────────
import {
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
} from '../services/persistentStore';

const RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

let isProcessing = false;
let syncInterval = null;

/**
 * Add an offline request to the queue
 * @param {object} request - { method, url, data, headers, timestamp, retries }
 */
export const enqueueRequest = (request) => {
  // Add to IndexedDB
  addToSyncQueue({
    method: request.method,
    url: request.url,
    data: request.data,
    headers: request.headers || {},
    retries: 0,
  });
  console.log(`📦 Request queued for offline sync: ${request.method} ${request.url}`);
};

/**
 * Process the sync queue – replay all pending requests
 * @param {function} apiCall - function to execute the request (e.g., axios instance)
 * @returns {Promise<{ success: number, failed: number }>}
 */
export const processQueue = async (apiCall) => {
  if (isProcessing) return;
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  isProcessing = true;
  console.log(`🔄 Processing ${queue.length} queued requests...`);

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    const request = item.operation;
    try {
      await apiCall({
        method: request.method,
        url: request.url,
        data: request.data,
        headers: request.headers || {},
      });
      success++;
      await removeFromSyncQueue(item.id);
      console.log(`✅ Replayed: ${request.method} ${request.url}`);
    } catch (error) {
      request.retries = (request.retries || 0) + 1;
      if (request.retries < MAX_RETRIES) {
        // Update in queue (we'll just keep it)
        console.warn(`⏳ Retry ${request.retries}/${MAX_RETRIES}: ${request.method} ${request.url}`);
      } else {
        failed++;
        console.error(`❌ Failed permanently: ${request.method} ${request.url}`, error);
        await removeFromSyncQueue(item.id);
      }
    }
  }

  isProcessing = false;
  console.log(`✅ Sync complete: ${success} succeeded, ${failed} failed`);

  // If there are still items, schedule another attempt
  const remaining = await getSyncQueue();
  if (remaining.length > 0 && !syncInterval) {
    syncInterval = setInterval(() => processQueue(apiCall), RETRY_DELAY);
  } else if (remaining.length === 0 && syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  return { success, failed };
};

/**
 * Check if there are pending items in the queue
 */
export const hasPending = async () => {
  const queue = await getSyncQueue();
  return queue.length > 0;
};

/**
 * Clear the queue (e.g., on logout)
 */
export const clearQueue = async () => {
  await clearSyncQueue();
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
  const queue = await getSyncQueue();
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
