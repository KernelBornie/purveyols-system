import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card, { LoadingSpinner, StatCard } from '../shared/UI';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports = () => {
  const now = new Date();
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(1);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = `?period=${period}&year=${year}&month=${month}&week=${week}`;
      const [sumRes, payRes, workerRes, logRes] = await Promise.all([
        api.get(`/reports/summary${params}`),
        api.get(`/reports/payments${params}`),
        api.get('/reports/workers'),
        api.get(`/reports/logbooks${params}`),
      ]);
      setSummary(sumRes.data);
      setPayments(payRes.data.payments || []);
      setWorkers(workerRes.data.workers || []);
      setLogbooks(logRes.data.entries || []);
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []); // eslint-disable-line

  const handlePrint = () => window.print();

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>📈 Reports</h2>
        <button onClick={handlePrint} style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>🖨️ Print Report</button>
      </div>

      {/* Filter controls */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }}>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {period === 'monthly' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}
          {period === 'weekly' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Week</label>
              <input type="number" min="1" max="52" value={week} onChange={(e) => setWeek(Number(e.target.value))} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px', width: '70px' }} />
            </div>
          )}
          <button onClick={fetchReports} style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Generate Report</button>
        </div>
      </Card>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}
      {loading && <LoadingSpinner />}

      {!loading && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Active Workers" value={summary.workers?.active || 0} icon="👷" color="#1a237e" />
            <StatCard label="Wages Paid" value={`K${(summary.payments?.totalAmount || 0).toLocaleString()}`} icon="💰" color="#2e7d32" />
            <StatCard label="Payments Made" value={summary.payments?.count || 0} icon="💸" color="#2e7d32" />
            <StatCard label="Pending Funding" value={summary.fundingRequests?.pending || 0} icon="📋" color="#e65100" />
            <StatCard label="Vehicle Trips" value={summary.logistics?.trips || 0} icon="🚛" color="#006064" />
            <StatCard label="Fuel Used" value={`${(summary.logistics?.totalFuel || 0).toFixed(1)} L`} icon="⛽" color="#880e4f" />
          </div>

          {/* Wage Payments Table */}
          {payments.length > 0 && (
            <Card title={`💸 Wage Payments (${payments.length} records)`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      {['Worker', 'Amount', 'Days', 'Network', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 12px' }}>{p.worker?.name} ({p.worker?.nrc})</td>
                        <td style={{ padding: '8px 12px' }}>K{p.amount?.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px' }}>{p.days}</td>
                        <td style={{ padding: '8px 12px', textTransform: 'uppercase' }}>{p.mobileNetwork}</td>
                        <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: p.status === 'completed' ? '#2e7d32' : '#c62828' }}>{p.status}</td>
                        <td style={{ padding: '8px 12px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Workers by Site */}
          {workers.length > 0 && (
            <Card title={`👷 Workers (${workers.length} total)`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      {['Name', 'NRC', 'Phone', 'Daily Rate', 'Site', 'Enrolled By'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 12px' }}>{w.name}</td>
                        <td style={{ padding: '8px 12px' }}>{w.nrc}</td>
                        <td style={{ padding: '8px 12px' }}>{w.phone}</td>
                        <td style={{ padding: '8px 12px' }}>K{w.dailyRate?.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px' }}>{w.site}</td>
                        <td style={{ padding: '8px 12px' }}>{w.enrolledBy?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Logbooks */}
          {logbooks.length > 0 && (
            <Card title={`🚛 Logbooks (${logbooks.length} trips)`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      {['Driver', 'Date', 'Vehicle', 'Route', 'Distance', 'Fuel'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logbooks.map((e) => (
                      <tr key={e._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 12px' }}>{e.driver?.name}</td>
                        <td style={{ padding: '8px 12px' }}>{new Date(e.date).toLocaleDateString()}</td>
                        <td style={{ padding: '8px 12px' }}>{e.vehicleNumber}</td>
                        <td style={{ padding: '8px 12px' }}>{e.route}</td>
                        <td style={{ padding: '8px 12px' }}>{e.distanceKm} km</td>
                        <td style={{ padding: '8px 12px' }}>{e.fuelLitres} L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
