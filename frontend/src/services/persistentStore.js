// Persistent storage service – all data stored in localStorage
// Data NEVER disappears unless explicitly deleted

class PersistentStore {
  constructor() {
    this.prefix = 'purveyols_';
    this.cache = {};
  }

  // Get all keys with prefix
  getKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }

  // Set data with optional expiry
  set(key, data, expiryMinutes = null) {
    const fullKey = this.prefix + key;
    const item = {
      data: data,
      timestamp: new Date().toISOString(),
      expires: expiryMinutes ? Date.now() + expiryMinutes * 60000 : null,
    };
    localStorage.setItem(fullKey, JSON.stringify(item));
    this.cache[key] = item;
    return data;
  }

  // Get data – returns null if expired or not found
  get(key) {
    const fullKey = this.prefix + key;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      
      const item = JSON.parse(raw);
      
      // Check if expired
      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(fullKey);
        delete this.cache[key];
        return null;
      }
      
      this.cache[key] = item;
      return item.data;
    } catch (e) {
      return null;
    }
  }

  // Remove data
  remove(key) {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
    delete this.cache[key];
    return true;
  }

  // Clear all app data
  clearAll() {
    const keys = this.getKeys();
    keys.forEach(key => {
      localStorage.removeItem(this.prefix + key);
    });
    this.cache = {};
    return true;
  }

  // Get all data as object
  getAll() {
    const result = {};
    const keys = this.getKeys();
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  // Check if key exists
  has(key) {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  // Get timestamp of last update
  getTimestamp(key) {
    const fullKey = this.prefix + key;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const item = JSON.parse(raw);
      return item.timestamp;
    } catch (e) {
      return null;
    }
  }
}

// Single instance
const store = new PersistentStore();

// Helper functions for common data types
export const saveWorkers = (data) => store.set('workers', data);
export const getWorkers = () => store.get('workers') || [];

export const saveProjects = (data) => store.set('projects', data);
export const getProjects = () => store.get('projects') || [];

export const saveFundingRequests = (data) => store.set('funding', data);
export const getFundingRequests = () => store.get('funding') || [];

export const savePayments = (data) => store.set('payments', data);
export const getPayments = () => store.get('payments') || [];

export const saveProcurementOrders = (data) => store.set('procurement', data);
export const getProcurementOrders = () => store.get('procurement') || [];

export const saveBOQs = (data) => store.set('boqs', data);
export const getBOQs = () => store.get('boqs') || [];

export const saveSubcontracts = (data) => store.set('subcontracts', data);
export const getSubcontracts = () => store.get('subcontracts') || [];

export const saveNotifications = (data) => store.set('notifications', data);
export const getNotifications = () => store.get('notifications') || [];

export const saveMessages = (data) => store.set('messages', data);
export const getMessages = () => store.get('messages') || [];

export const saveAdvertisedProjects = (data) => store.set('advertised', data);
export const getAdvertisedProjects = () => store.get('advertised') || [];

export const saveDashboardStats = (data) => store.set('stats', data);
export const getDashboardStats = () => store.get('stats') || {};

export const saveUserProfile = (data) => store.set('profile', data);
export const getUserProfile = () => store.get('profile') || null;

// App settings
export const saveAppSettings = (data) => store.set('settings', data);
export const getAppSettings = () => store.get('settings') || {};

// Sync queue
export const saveSyncQueue = (data) => store.set('syncQueue', data);
export const getSyncQueue = () => store.get('syncQueue') || [];

export default {
  store,
  saveWorkers,
  getWorkers,
  saveProjects,
  getProjects,
  saveFundingRequests,
  getFundingRequests,
  savePayments,
  getPayments,
  saveProcurementOrders,
  getProcurementOrders,
  saveBOQs,
  getBOQs,
  saveSubcontracts,
  getSubcontracts,
  saveNotifications,
  getNotifications,
  saveMessages,
  getMessages,
  saveAdvertisedProjects,
  getAdvertisedProjects,
  saveDashboardStats,
  getDashboardStats,
  saveUserProfile,
  getUserProfile,
  saveAppSettings,
  getAppSettings,
  saveSyncQueue,
  getSyncQueue,
};
