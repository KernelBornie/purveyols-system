import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getStore, putRecord, deleteRecord, addToSyncQueue } from '../services/persistentStore';

export const useOfflineData = (endpoint, storeName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from offline store
  useEffect(() => {
    const loadData = async () => {
      try {
        const offlineData = await getStore(storeName);
        setData(offlineData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [storeName]);

  // Create
  const create = async (newData) => {
    try {
      if (navigator.onLine) {
        const response = await api.post(endpoint, newData);
        const created = response.data;
        await putRecord(storeName, created);
        setData(prev => [...prev, created]);
        return created;
      } else {
        // Offline: store locally and queue
        const tempId = 'temp_' + Date.now();
        const localRecord = { ...newData, _id: tempId, __pending: true };
        await putRecord(storeName, localRecord);
        setData(prev => [...prev, localRecord]);
        await addToSyncQueue({
          method: 'POST',
          url: endpoint,
          data: newData
        });
        return localRecord;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update
  const update = async (id, updatedData) => {
    try {
      if (navigator.onLine) {
        const response = await api.put(`${endpoint}/${id}`, updatedData);
        const updated = response.data;
        await putRecord(storeName, updated);
        setData(prev => prev.map(item => item._id === id ? updated : item));
        return updated;
      } else {
        // Offline: update locally and queue
        const localRecord = { ...updatedData, _id: id, __pending: true };
        await putRecord(storeName, localRecord);
        setData(prev => prev.map(item => item._id === id ? localRecord : item));
        await addToSyncQueue({
          method: 'PUT',
          url: endpoint,
          data: updatedData,
          id: id
        });
        return localRecord;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete
  const remove = async (id) => {
    try {
      if (navigator.onLine) {
        await api.delete(`${endpoint}/${id}`);
        await deleteRecord(storeName, id);
        setData(prev => prev.filter(item => item._id !== id));
      } else {
        // Offline: delete locally and queue
        await deleteRecord(storeName, id);
        setData(prev => prev.filter(item => item._id !== id));
        await addToSyncQueue({
          method: 'DELETE',
          url: endpoint,
          id: id
        });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { data, loading, error, create, update, remove };
};
