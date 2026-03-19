import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateAmount = (quantity, unitRate) => parseNumber(quantity) * parseNumber(unitRate);

const emptyItem = () => ({ description: '', unit: '', quantity: '', unitRate: '', amount: 0 });

const BOQForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ title: '', site: '', project: '', notes: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then((r) => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/boq/${id}`)
        .then((r) => {
          const b = r.data.boq;
          setForm({
            title: b.title || '',
            site: b.site || '',
            project: b.project?._id || '',
            notes: b.notes || '',
          });
          setItems(
              b.items?.length
                ? b.items.map((it) => {
                    const quantity = it.quantity ?? '';
                    const unitRate = it.unitRate ?? '';
                    return {
                      description: it.description || '',
                      unit: it.unit || '',
                      quantity,
                      unitRate,
                      amount: calculateAmount(quantity, unitRate),
                    };
                  })
                : [emptyItem()]
          );
        })
        .catch(() => setError('Failed to load BOQ'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (index, e) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const nextItem = { ...item, [e.target.name]: e.target.value };
      return {
        ...nextItem,
        amount: calculateAmount(nextItem.quantity, nextItem.unitRate),
      };
    });
    setItems(updated);
  };

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const totalAmount = items.reduce((sum, it) => sum + parseNumber(it.amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        project: form.project || undefined,
        items: items.map((it) => ({
          description: it.description,
          unit: it.unit,
          quantity: parseNumber(it.quantity),
          unitRate: parseNumber(it.unitRate),
          amount: parseNumber(it.amount),
        })),
      };
      if (isEdit) {
        await API.put(`/boq/${id}`, payload);
      } else {
        await API.post('/boq', payload);
      }
      navigate('/boq');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save BOQ');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit BOQ' : 'New Bill of Quantities'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input name="title" className="form-control" value={form.title} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label>Site</label>
              <input name="site" className="form-control" value={form.site} onChange={handleFormChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleFormChange}>
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input name="notes" className="form-control" value={form.notes} onChange={handleFormChange} />
            </div>
          </div>

          {/* BOQ Items */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>BOQ Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description *</th>
                    <th>Unit *</th>
                    <th>Quantity *</th>
                    <th>Unit Rate (ZMW) *</th>
                    <th>Amount (ZMW)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const amt = parseNumber(item.amount);
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <input
                            name="description"
                            className="form-control"
                            value={item.description}
                            onChange={(e) => handleItemChange(i, e)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            name="unit"
                            className="form-control"
                            value={item.unit}
                            onChange={(e) => handleItemChange(i, e)}
                            required
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(i, e)}
                            required
                            min="0"
                            step="0.01"
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="unitRate"
                            className="form-control"
                            value={item.unitRate}
                            onChange={(e) => handleItemChange(i, e)}
                            required
                            min="0"
                            step="0.01"
                            style={{ width: '110px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>K{amt.toLocaleString()}</td>
                        <td>
                          {items.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeItem(i)}
                              >
                                Remove Item
                              </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td>
                    <td style={{ fontWeight: 700, color: '#1565c0' }}>K{totalAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update BOQ' : 'Create BOQ'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/boq')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BOQForm;
