import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const MaterialListPage = () => {
  const { user } = useContext(AuthContext);
  const [materialLists, setMaterialLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    API.get('/material-list')
      .then((r) => setMaterialLists(r.data.materialLists || []))
      .catch(() => setError('Failed to load material lists'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material list?')) return;
    try {
      await API.delete(`/material-list/${id}`);
      setMaterialLists(materialLists.filter((ml) => ml._id !== id));
      setMsg('Material list deleted');
    } catch {
      setError('Failed to delete material list');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Material List</h1>
        {['engineer', 'director', 'admin'].includes(user?.role) && (
          <Link to="/material-list/new" className="btn btn-primary">+ New Material List</Link>
        )}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error} ✕</div>}
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading material lists...</div>
        ) : materialLists.length === 0 ? (
          <div className="empty-state">No material lists found. <Link to="/material-list/new">Create one</Link></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Cost (ZMW)</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materialLists.map((ml) =>
                  ml.items && ml.items.length > 0 ? (
                    ml.items.map((item, idx) => (
                      <tr key={`${ml._id}-${idx}`}>
                        {idx === 0 && (
                          <>
                            <td rowSpan={ml.items.length}>{ml.projectId?.name || '—'}</td>
                          </>
                        )}
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>K{item.cost?.toLocaleString()}</td>
                        {idx === 0 && (
                          <>
                            <td rowSpan={ml.items.length}>{ml.createdBy?.name || '—'}</td>
                            <td rowSpan={ml.items.length}>{new Date(ml.createdAt).toLocaleDateString()}</td>
                            <td rowSpan={ml.items.length}>
                              <div className="actions">
                                <Link to={`/material-list/${ml._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                                {['director', 'admin'].includes(user?.role) && (
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ml._id)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr key={ml._id}>
                      <td>{ml.projectId?.name || '—'}</td>
                      <td colSpan={3} style={{ color: '#999' }}>No items</td>
                      <td>{ml.createdBy?.name || '—'}</td>
                      <td>{new Date(ml.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="actions">
                          <Link to={`/material-list/${ml._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                          {['director', 'admin'].includes(user?.role) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ml._id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialListPage;
