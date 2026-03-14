import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

const PERSONNEL_CATEGORIES = [
  'Electrician',
  'Plumber',
  'Bricklayer',
  'Carpenter',
  'Welder',
  'Painter',
  'Tiler',
  'Mason',
  'Other',
];

const MACHINERY_CATEGORIES = [
  'Crane',
  'Excavator',
  'Bulldozer',
  'Concrete Mixer',
  'Compactor',
  'Forklift',
  'Scaffolding',
  'Generator',
  'Other',
];

const SubcontractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    type: 'personnel',
    name: '',
    category: '',
    company: '',
    dateHired: '',
    amount: '',
    site: '',
    project: '',
    notes: '',
    status: 'active',
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    API.get('/projects').then((r) => setProjects(r.data)).catch(() => {});
    if (isEdit) {
      API.get(`/subcontracts/${id}`)
        .then((r) => {
          const s = r.data.subcontract;
          setForm({
            type: s.type || 'personnel',
            name: s.name || '',
            category: s.category || '',
            company: s.company || '',
            dateHired: s.dateHired ? s.dateHired.substring(0, 10) : '',
            amount: s.amount ?? '',
            site: s.site || '',
            project: s.project?._id || '',
            notes: s.notes || '',
            status: s.status || 'active',
          });
        })
        .catch(() => setError('Failed to load record'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, project: form.project || undefined };
      if (isEdit) {
        await API.put(`/subcontracts/${id}`, payload);
      } else {
        await API.post('/subcontracts', payload);
      }
      navigate('/subcontracts');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = form.type === 'personnel' ? PERSONNEL_CATEGORIES : MACHINERY_CATEGORIES;

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Subcontract Record' : 'Hire Personnel / Machinery'}</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* Type */}
          <div className="form-group">
            <label>Type *</label>
            <select name="type" className="form-control" value={form.type} onChange={handleChange} required>
              <option value="personnel">Personnel</option>
              <option value="machinery">Machinery</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{form.type === 'personnel' ? 'Personnel Name *' : 'Machinery Name *'}</label>
              <input
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder={form.type === 'personnel' ? 'e.g. John Banda' : 'e.g. 50-ton Crane'}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                <option value="">— Select Category —</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Hired From *</label>
              <input
                name="company"
                className="form-control"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. ABC Contractors Ltd"
                required
              />
            </div>
            <div className="form-group">
              <label>Date Hired *</label>
              <input
                type="date"
                name="dateHired"
                className="form-control"
                value={form.dateHired}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount Hired For (ZMW) *</label>
              <input
                type="number"
                name="amount"
                className="form-control"
                value={form.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Site</label>
              <input name="site" className="form-control" value={form.site} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Project</label>
              <select name="project" className="form-control" value={form.project} onChange={handleChange}>
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Save Record'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/subcontracts')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcontractForm;
