import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { StatCard, LoadingSpinner } from '../shared/UI';

const DriverDashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logbooks')
      .then((res) => setEntries(res.data.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalDist = entries.reduce((s, e) => s + (e.distanceKm || 0), 0);
  const totalFuel = entries.reduce((s, e) => s + (e.fuelLitres || 0), 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#006064' }}>🚛 Driver Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Trips" value={entries.length} icon="🚗" color="#006064" />
        <StatCard label="Total Distance" value={`${totalDist.toFixed(1)} km`} icon="📍" color="#006064" />
        <StatCard label="Fuel Used" value={`${totalFuel.toFixed(1)} L`} icon="⛽" color="#e65100" />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/logbooks/new" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#006064', color: '#fff', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
            📝 Submit New Logbook Entry
          </div>
        </Link>
      </div>

      <Card title="📚 My Recent Logbook Entries">
        {entries.length === 0 ? (
          <p style={{ color: '#666' }}>No logbook entries yet. <Link to="/logbooks/new">Submit one</Link></p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Date', 'Vehicle', 'Route', 'Time In', 'Time Out', 'Distance', 'Fuel'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 10).map((e) => (
                  <tr key={e._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px' }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 12px' }}>{e.vehicleNumber}</td>
                    <td style={{ padding: '8px 12px' }}>{e.route}</td>
                    <td style={{ padding: '8px 12px' }}>{e.timeIn}</td>
                    <td style={{ padding: '8px 12px' }}>{e.timeOut}</td>
                    <td style={{ padding: '8px 12px' }}>{e.distanceKm} km</td>
                    <td style={{ padding: '8px 12px' }}>{e.fuelLitres} L</td>
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

export default DriverDashboard;
