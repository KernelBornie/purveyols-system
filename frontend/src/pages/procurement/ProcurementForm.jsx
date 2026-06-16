import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, MenuItem, IconButton, Box, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ project: '', items: [], status: 'draft' });
  const [projects, setProjects] = useState([]);
  const [creator, setCreator] = useState(null);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
    if (id) {
      api.get(`/api/procurement/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.createdBy);
        const total = res.data.items.reduce((sum, item) => sum + (item.total || 0), 0);
        setGrandTotal(total);
      });
    } else {
      setCreator(user);
      setForm({ ...form, items: [{ name: '', quantity: 1, unitPrice: '', supplier: '', notes: '' }] });
    }
  }, [id, user]);

  // Auto-calculate total for each item whenever quantity or unitPrice changes
  useEffect(() => {
    const itemsWithTotal = form.items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      return { ...item, total: total || '' };
    });
    const grand = itemsWithTotal.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    setGrandTotal(grand);
    setForm(prev => ({ ...prev, items: itemsWithTotal }));
  }, [form.items.map(item => `${item.quantity}-${item.unitPrice}`).join()]);

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: '', quantity: 1, unitPrice: '', supplier: '', notes: '' }]
    });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsToSubmit = form.items.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      total: parseFloat(item.total) || 0
    }));
    const payload = { ...form, items: itemsToSubmit };
    try {
      if (id) await api.put(`/api/procurement/${id}`, payload);
      else await api.post('/api/procurement', payload);
      navigate('/procurement');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">{id ? 'Edit Order' : 'New Procurement Order (blank amounts)'}</Typography>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Created by' : 'Created by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          select
          label="Project"
          fullWidth
          margin="normal"
          value={form.project}
          onChange={e => setForm({ ...form, project: e.target.value })}
          required
        >
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Items (unitPrice can be left blank initially)</Typography>
        {form.items.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Item"
              value={item.name}
              onChange={e => handleItemChange(idx, 'name', e.target.value)}
              required
              sx={{ minWidth: 120 }}
            />
            <TextField
              label="Qty"
              type="number"
              value={item.quantity}
              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
              sx={{ width: 80 }}
            />
            <TextField
              label="Unit Price"
              type="number"
              value={item.unitPrice}
              onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
              placeholder="blank"
              sx={{ width: 120 }}
            />
            <TextField
              label="Total"
              type="number"
              value={item.total}
              InputProps={{ readOnly: true }}
              sx={{ width: 120, bgcolor: '#f0f0f0' }}
            />
            <TextField
              label="Supplier"
              value={item.supplier}
              onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
              sx={{ width: 120 }}
            />
            <IconButton onClick={() => removeItem(idx)}><DeleteIcon /></IconButton>
          </Box>
        ))}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined">Add Item</Button>
          <Typography variant="h6">
            Grand Total: <strong>{(grandTotal || 0).toFixed(2)}</strong>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Order</Button>
      </form>
    </Paper>
  );
};

export default ProcurementForm;
