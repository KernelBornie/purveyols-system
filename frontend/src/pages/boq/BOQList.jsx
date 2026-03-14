import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const BOQList = () => {
  const { user } = useContext(AuthContext);
  const [boqs, setBOQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    API.get('/boq')
      .then((r) => setBOQs(r.data.boqs || []))
      .catch(() => setError('Failed to load BOQs'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (id) => {
    try {
      const res = await API.put(`/boq/${id}/submit`);
      setBOQs(boqs.map((b) => (b._id === id ? res.data.boq : b)));
      setMsg('BOQ submitted successfully');
    } catch {
      setError('Failed to submit BOQ');
    }
  };

  const handleShare = async (id) => {
    try {
      const res = await API.put(`/boq/${id}/share`);
      setBOQs(boqs.map((b) => (b._id === id ? res.data.boq : b)));
      setMsg('BOQ marked as shared');
    } catch {
      setError('Failed to share BOQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this BOQ?')) return;
    try {
      await API.delete(`/boq/${id}`);
      setBOQs(boqs.filter((b) => b._id !== id));
      setMsg('BOQ deleted');
    } catch {
      setError('Failed to delete BOQ');
    }
  };

  const statusColor = (s) => {
    const map = { draft: '#757575', submitted: '#f57c00', approved: '#2e7d32', rejected: '#c62828', shared: '#1565c0' };
    return map[s] || '#757575';
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Bills of Quantities (BOQ)</h1>
        {['engineer', 'director', 'admin'].includes(user?.role) && (
          <Link to="/boq/new" className="btn btn-primary">+ New BOQ</Link>
        )}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error} ✕</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading BOQs...</div>
        ) : boqs.length === 0 ? (
          <div className="empty-state">No BOQs found. <Link to="/boq/new">Create one</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Site</th>
                  <th>Project</th>
                  <th>Items</th>
                  <th>Total (ZMW)</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boqs.map((boq) => (
                  <tr key={boq._id}>
                    <td><strong>{boq.title}</strong></td>
                    <td>{boq.site || '—'}</td>
                    <td>{boq.project?.name || '—'}</td>
                    <td>{boq.items?.length || 0}</td>
                    <td>K{boq.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: statusColor(boq.status), textTransform: 'capitalize' }}>
                        {boq.status}
                      </span>
                    </td>
                    <td>{boq.createdBy?.name || '—'}</td>
                    <td>{new Date(boq.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/boq/${boq._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        {boq.status === 'draft' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(boq._id)}>
                            Submit
                          </button>
                        )}
                        {['submitted', 'approved'].includes(boq.status) && (
                          <button className="btn btn-success btn-sm" onClick={() => handleShare(boq._id)}>
                            Share
                          </button>
                        )}
                        {['director', 'admin'].includes(user?.role) && boq.status === 'draft' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(boq._id)}>
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

export default BOQList;
