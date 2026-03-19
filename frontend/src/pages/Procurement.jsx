import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const emptyItem = () => ({
  name: '',
  quantity: '',
  unitPrice: ''
});

const CURRENCY_SYMBOL = 'K';

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const isEdit = Boolean(id);

  const [items, setItems] = useState([emptyItem()]);
  const [form, setForm] = useState({
    project: '',
    deliveryDate: ''
  });

  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects')
      .then(res => setProjects(res.data))
      .catch(() => {});

    if (isEdit) {
      API.get(`/procurement/${id}`)
        .then(res => {
          const o = res.data;

          setItems(
            (o.items || []).map(i => ({
              name: i.name || '',
              quantity: i.quantity || '',
              unitPrice: i.unitPrice || ''
            }))
          );

          setForm({
            project: o.project?._id || '',
            deliveryDate: o.deliveryDate
              ? o.deliveryDate.substring(0, 10)
              : ''
          });
        })
        .catch(() => setError('Failed to load order'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleItemChange = (index, e) => {
    const updated = [...items];
    updated[index][e.target.name] = e.target.value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, emptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const grandTotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const item of items) {
      if (!item.name.trim()) {
        setError('Each item must have a description');
        return;
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        setError('Quantity must be at least 1');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map(item => ({
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice) || 0
        })),
        project: form.project || undefined,
        deliveryDate: form.deliveryDate || undefined
      };

      if (isEdit) {
        await API.put(`/procurement/${id}`, payload);
      } else {
        await API.post('/procurement', payload);
      }

      navigate('/procurement');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Procurement Order' : 'New Procurement Order'}</h1>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <h3>Procurement Items</h3>

          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description *</th>
                <th>Quantity *</th>
                <th>Unit Price (ZMW)</th>
                <th>Amount (ZMW)</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const total =
                  item.quantity && item.unitPrice
                    ? Number(item.quantity) * Number(item.unitPrice)
                    : 0;

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td>
                      <input
                        name="name"
                        className="form-control"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        min="1"
                        required
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        name="unitPrice"
                        className="form-control"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, e)}
                        step="0.01"
                      />
                    </td>

                    <td style={{ fontWeight: 'bold' }}>
                      {CURRENCY_SYMBOL}{total.toLocaleString()}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeItem(index)}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addItem}
            style={{ marginTop: '10px' }}
          >
            + Add Item
          </button>

          <div style={{ textAlign: 'right', marginTop: '15px' }}>
            <strong>
              Total: {CURRENCY_SYMBOL}{grandTotal.toLocaleString()}
            </strong>
          </div>

          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Project</label>
              <select
                name="project"
                className="form-control"
                value={form.project}
                onChange={handleFormChange}
              >
                <option value="">— Select Project —</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                className="form-control"
                value={form.deliveryDate}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Submit Request'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/procurement')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcurementForm;