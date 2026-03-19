import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SubcontractList = () => {
  const { user } = useContext(AuthContext);
  const [subcontracts, setSubcontracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    API.get('/subcontracts')
      .then((r) => setSubcontracts(r.data.subcontracts || []))
      .catch(() => setError('Failed to load subcontracts'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subcontract record? This is a soft delete.')) return;
    try {
      const res = await API.delete(`/subcontracts/${id}`);
      setSubcontracts(subcontracts.map((s) => (s._id === id ? res.data.subcontract : s)));
      setMsg('Record deleted');
    } catch {
      setError('Failed to delete record');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this subcontract?')) return;
    try {
      const res = await API.put(`/subcontracts/${id}/deactivate`);
      setSubcontracts(subcontracts.map(s => s._id === id ? res.data.subcontract : s));
      setMsg('Subcontract deactivated');
    } catch {
      setError('Failed to deactivate subcontract');
    }
  };

  const statusColor = (s) => {
    const map = { active: '#2e7d32', completed: '#1565c0', cancelled: '#c62828' };
    return map[s] || '#757575';
  };

  return (
    <div>
      <div className="page-header">
        <h1>🏗️ Subcontracts &amp; Hired Resources</h1>
        {['engineer', 'director', 'admin'].includes(user?.role) && (
          <Link to="/subcontracts/new" className="btn btn-primary">+ Hire Personnel / Machinery</Link>
        )}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error} ✕</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : subcontracts.length === 0 ? (
          <div className="empty-state">
            No subcontract records found. <Link to="/subcontracts/new">Hire personnel or machinery</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Company Hired From</th>
                  <th>Date Hired</th>
                  <th>Amount (ZMW)</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Hired By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subcontracts.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{s.type}</span>
                    </td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.category || '—'}</td>
                    <td>{s.company}</td>
                    <td>{new Date(s.dateHired).toLocaleDateString()}</td>
                    <td>K{s.amount?.toLocaleString()}</td>
                    <td>{s.site || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: statusColor(s.status), textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.hiredBy?.name || '—'}</td>
                    <td>
                      <div className="actions">
                        {user?.role === 'engineer' && (
                          <Link to={`/subcontracts/${s._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        )}
                        {user?.role === 'engineer' && s.isActive !== false && (
                          <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(s._id)}>
                            Deactivate
                          </button>
                        )}
                        {user?.role === 'engineer' && s.isActive !== false && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcontractList;
