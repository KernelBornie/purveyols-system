import api from '../api/axios';

// ─── All sync functions are disabled ──────────────────────────────
// This prevents any pending-request retries, console spam, and queue processing.

export const syncAllData = async () => {
  return { success: false, disabled: true };
};

export const syncPendingOperations = async () => {};

export const initOfflineSync = async () => {};

export const processQueue = async () => {};

export const getAllPersistentData = async () => ({});
export const hasPersistentData = async () => false;
export const refreshAllData = async () => ({});

export const initSync = () => {};

export default {
  syncAllData,
  syncPendingOperations,
  getAllPersistentData,
  hasPersistentData,
  refreshAllData,
  initSync,
  initOfflineSync,
  processQueue,
  ENDPOINT_MAP: {},
};