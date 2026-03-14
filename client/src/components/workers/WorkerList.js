import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { saveToStore, getFromStore, STORES } from '../../utils/indexedDB';
import Card, { LoadingSpinner, Button } from '../shared/UI';

const WorkerList = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [nrcSearch, setNrcSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const loadWorkers = async () => {
      if (!navigator.onLine) {
        const cached = await getFromStore(STORES.workers);
        setWorkers(cached);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/workers');
        setWorkers(res.data.workers);
        await saveToStore(STORES.workers, res.data.workers);
      } catch (err) {
        setError('Failed to load workers');
        // Fallback to cached
        const cached = await getFromStore(STORES.workers);
        setWorkers(cached);
      } finally {
        setLoading(false);
      }
    };
    loadWorkers();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNrcSearch = async () => {
    if (!nrcSearch.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/workers/search?nrc=${encodeURIComponent(nrcSearch)}`);
      setWorkers([res.data.worker]);
    } catch (err) {
      setError(err.response?.data?.message || 'Worker not found');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = workers.filter((w) =>
    search === '' || w.name?.toLowerCase().includes(search.toLowerCase()) || w.nrc?.includes(search)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>👷 Enrolled Workers</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOffline && <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', alignSelf: 'center' }}>OFFLINE</span>}
          <Link to="/workers/new">
            <Button variant="primary">+ Enroll Worker</Button>
          </Link>
        </div>
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem', background: '#ffebee', padding: '10px', borderRadius: '6px' }}>{error}</div>}

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or NRC..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', minWidth: '200px' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={nrcSearch}
              onChange={(e) => setNrcSearch(e.target.value)}
              placeholder="Search exact NRC..."
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', width: '200px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleNrcSearch()}
            />
            <Button onClick={handleNrcSearch} variant="secondary">🔍 Find</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No workers found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Name', 'NRC', 'Phone', 'Daily Rate', 'Site', 'Role', 'Enrolled By', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{w.name}</td>
                    <td style={{ padding: '10px 12px' }}>{w.nrc}</td>
                    <td style={{ padding: '10px 12px' }}>{w.phone}</td>
                    <td style={{ padding: '10px 12px' }}>K{w.dailyRate?.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>{w.site}</td>
                    <td style={{ padding: '10px 12px' }}>{w.jobRole || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{w.enrolledBy?.name || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>Showing {filtered.length} worker(s)</div>
      </Card>
    </div>
  );
};

export default WorkerList;
