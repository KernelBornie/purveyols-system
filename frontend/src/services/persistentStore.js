// ─── Persistent Store for Offline Data ──────────────────────
const STORE_KEY = 'persistentData';

/**
 * Get all stored data
 */
export const getAllData = () => {
  try {
    const data = localStorage.getItem(STORE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

/**
 * Save all data
 */
export const saveAllData = (data) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save persistent data:', e);
  }
};

// ─── Individual getters/setters ──────────────────────────────
export const getWorkers = () => getAllData().workers || [];
export const saveWorkers = (workers) => {
  const data = getAllData();
  data.workers = workers;
  saveAllData(data);
};

export const getProjects = () => getAllData().projects || [];
export const saveProjects = (projects) => {
  const data = getAllData();
  data.projects = projects;
  saveAllData(data);
};

export const getFundingRequests = () => getAllData().funding || [];
export const saveFundingRequests = (funding) => {
  const data = getAllData();
  data.funding = funding;
  saveAllData(data);
};

export const getPayments = () => getAllData().payments || [];
export const savePayments = (payments) => {
  const data = getAllData();
  data.payments = payments;
  saveAllData(data);
};

export const getProcurementOrders = () => getAllData().procurement || [];
export const saveProcurementOrders = (procurement) => {
  const data = getAllData();
  data.procurement = procurement;
  saveAllData(data);
};

export const getBOQs = () => getAllData().boqs || [];
export const saveBOQs = (boqs) => {
  const data = getAllData();
  data.boqs = boqs;
  saveAllData(data);
};

export const getSubcontracts = () => getAllData().subcontracts || [];
export const saveSubcontracts = (subcontracts) => {
  const data = getAllData();
  data.subcontracts = subcontracts;
  saveAllData(data);
};

export const getNotifications = () => getAllData().notifications || [];
export const saveNotifications = (notifications) => {
  const data = getAllData();
  data.notifications = notifications;
  saveAllData(data);
};

export const getDeliveryNotes = () => getAllData().delivery || [];
export const saveDeliveryNotes = (delivery) => {
  const data = getAllData();
  data.delivery = delivery;
  saveAllData(data);
};

export default {
  getAllData,
  saveAllData,
  getWorkers,
  saveWorkers,
  getProjects,
  saveProjects,
  getFundingRequests,
  saveFundingRequests,
  getPayments,
  savePayments,
  getProcurementOrders,
  saveProcurementOrders,
  getBOQs,
  saveBOQs,
  getSubcontracts,
  saveSubcontracts,
  getNotifications,
  saveNotifications,
  getDeliveryNotes,
  saveDeliveryNotes,
};
