import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AttendanceList = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [markingId, setMarkingId] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [formState, setFormState] = useState({});

  useEffect(() => {
    API.get('/workers')
      .then(r => setWorkers(r.data.workers || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load workers'))
      .finally(() => setLoading(false));
  }, []);

  const initForm = (workerId) => {
    const existing = attendanceMap[workerId];
    setFormState({
      status: existing?.status || 'present',
      overtimeHours: existing?.overtimeHours ?? 0,
      overtimeRate: existing?.overtimeRate ?? 0
    });
    setMarkingId(workerId);
  };

  const handleMark = async (workerId) => {
    const { status, overtimeHours, overtimeRate } = formState;
    try {
      const res = await API.post('/attendance/mark', {
        workerId,
        date: selectedDate,
        status,
        overtimeHours: Number(overtimeHours),
        overtimeRate: Number(overtimeRate)
      });
      const record = res.data.attendance;
      setAttendanceMap(prev => ({ ...prev, [workerId]: record }));
      setMarkingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const activeWorkers = workers.filter(w => w.isActive);

  return (
    <div>
      <div className="page-header">
        <h1>📅 Attendance</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="attendance-date" style={{ fontWeight: 600 }}>Date:</label>
          <input
            id="attendance-date"
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setAttendanceMap({}); setMarkingId(null); }}
            style={{ width: '180px' }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : activeWorkers.length === 0 ? (
          <div className="empty-state">No active workers. <Link to="/workers/new">Enroll a worker</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>NRC</th>
                  <th>Daily Rate (ZMW)</th>
                  <th>Status</th>
                  <th>Overtime Hrs</th>
                  <th>Overtime Rate</th>
                  <th>Wage for Day</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeWorkers.map(worker => {
                  const record = attendanceMap[worker._id];
                  const isMarking = markingId === worker._id;
                  const overtimePay = record
                    ? (record.overtimeHours || 0) * (record.overtimeRate || 0)
                    : 0;
                  const wageForDay = record?.status === 'present'
                    ? (worker.dailyRate || 0) + overtimePay
                    : record?.status === 'absent' ? 0 : '—';

                  return (
                    <tr key={worker._id}>
                      <td>{worker.name}</td>
                      <td>{worker.nrc}</td>
                      <td>K{worker.dailyRate}</td>
                      <td>
                        {record ? (
                          <span className={`badge badge-${record.status === 'present' ? 'active' : 'inactive'}`}>
                            {record.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{record ? record.overtimeHours : '—'}</td>
                      <td>{record ? `K${record.overtimeRate}` : '—'}</td>
                      <td>{wageForDay !== '—' ? `K${wageForDay}` : '—'}</td>
                      <td>
                        <div className="actions">
                          {isMarking ? (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <select
                                className="form-control"
                                style={{ width: '110px' }}
                                value={formState.status}
                                onChange={e => setFormState(s => ({ ...s, status: e.target.value }))}
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                              </select>
                              <input
                                type="number"
                                className="form-control"
                                style={{ width: '90px' }}
                                placeholder="OT hrs"
                                min="0"
                                value={formState.overtimeHours}
                                onChange={e => setFormState(s => ({ ...s, overtimeHours: e.target.value }))}
                              />
                              <input
                                type="number"
                                className="form-control"
                                style={{ width: '90px' }}
                                placeholder="OT rate"
                                min="0"
                                value={formState.overtimeRate}
                                onChange={e => setFormState(s => ({ ...s, overtimeRate: e.target.value }))}
                              />
                              <button className="btn btn-primary btn-sm" onClick={() => handleMark(worker._id)}>Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setMarkingId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => initForm(worker._id)}
                              >
                                {record ? 'Edit' : 'Mark'}
                              </button>
                              <Link
                                to={`/attendance/worker/${worker._id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ marginLeft: '4px' }}
                              >
                                History
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '12px', color: '#666', fontSize: '0.9rem' }}>
          {activeWorkers.length} active worker{activeWorkers.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
