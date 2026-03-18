import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';

const AttendanceHistory = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      API.get(`/workers/${id}`),
      API.get(`/attendance/worker/${id}`)
    ])
      .then(([workerRes, attendanceRes]) => {
        setWorker(workerRes.data);
        setRecords(attendanceRes.data.attendance || []);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load attendance history'))
      .finally(() => setLoading(false));
  }, [id]);

  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const totalOvertimePay = records.reduce((sum, r) => sum + (r.overtimeHours || 0) * (r.overtimeRate || 0), 0);
  const totalWage = records.reduce((acc, r) => {
    if (r.status === 'present') {
      return acc + (worker?.dailyRate || 0) + (r.overtimeHours || 0) * (r.overtimeRate || 0);
    }
    return acc;
  }, 0);

  if (loading) return <div className="loading">Loading attendance history...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📅 Attendance History</h1>
        <Link to="/attendance" className="btn btn-secondary">← Back</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {worker && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '8px' }}>{worker.name}</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.95rem', color: '#555' }}>
            <span>NRC: <strong>{worker.nrc}</strong></span>
            <span>Daily Rate: <strong>K{worker.dailyRate}</strong></span>
            <span>Site: <strong>{worker.site || '—'}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
            <div className="stat-box">
              <span className="stat-value">{presentDays}</span>
              <span className="stat-label">Days Present</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{absentDays}</span>
              <span className="stat-label">Days Absent</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">K{totalOvertimePay.toFixed(2)}</span>
              <span className="stat-label">Total Overtime Pay</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">K{totalWage.toFixed(2)}</span>
              <span className="stat-label">Total Earned</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {records.length === 0 ? (
          <div className="empty-state">No attendance records found for this worker.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Overtime Hrs</th>
                  <th>Overtime Rate (ZMW)</th>
                  <th>Overtime Pay</th>
                  <th>Wage for Day</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const overtimePay = (record.overtimeHours || 0) * (record.overtimeRate || 0);
                  const wageForDay = record.status === 'present'
                    ? (worker?.dailyRate || 0) + overtimePay
                    : 0;
                  return (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${record.status === 'present' ? 'active' : 'inactive'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.overtimeHours}</td>
                      <td>K{record.overtimeRate}</td>
                      <td>K{overtimePay.toFixed(2)}</td>
                      <td>K{wageForDay.toFixed(2)}</td>
                      <td>{record.markedBy?.name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '12px', color: '#666', fontSize: '0.9rem' }}>
          Total records: {records.length}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
