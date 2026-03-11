import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card, { LoadingSpinner, Button } from '../shared/UI';

const LogbookList = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      const res = await api.get(`/logbooks?${params}`);
      setEntries(res.data.entries || []);
    } catch (err) {
      setError('Failed to load logbook entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []); // eslint-disable-line

  const totalDist = entries.reduce((s, e) => s + (e.distanceKm || 0), 0);
  const totalFuel = entries.reduce((s, e) => s + (e.fuelLitres || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>🚛 Driver Logbooks</h2>
        {user?.role === 'driver' && <Link to="/logbooks/new"><Button variant="primary">+ New Entry</Button></Link>}
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>From</label>
            <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>To</label>
            <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          </div>
          <Button onClick={fetchEntries} variant="secondary">🔍 Filter</Button>
        </div>

        {entries.length > 0 && (
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', padding: '10px 14px', background: '#e3f2fd', borderRadius: '6px', fontSize: '0.9rem' }}>
            <span>Trips: <strong>{entries.length}</strong></span>
            <span>Total Distance: <strong>{totalDist.toFixed(1)} km</strong></span>
            <span>Total Fuel: <strong>{totalFuel.toFixed(1)} L</strong></span>
          </div>
        )}

        {entries.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No logbook entries found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Driver', 'Date', 'Vehicle', 'Route', 'Purpose', 'Time In', 'Time Out', 'Distance', 'Fuel'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px' }}>{e.driver?.name || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px' }}>{e.vehicleNumber}</td>
                    <td style={{ padding: '10px 12px' }}>{e.route}</td>
                    <td style={{ padding: '10px 12px' }}>{e.purpose}</td>
                    <td style={{ padding: '10px 12px' }}>{e.timeIn}</td>
                    <td style={{ padding: '10px 12px' }}>{e.timeOut}</td>
                    <td style={{ padding: '10px 12px' }}>{e.distanceKm} km</td>
                    <td style={{ padding: '10px 12px' }}>{e.fuelLitres} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogbookList;
