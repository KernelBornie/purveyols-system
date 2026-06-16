import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, MenuItem, IconButton, Box, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const BOQForm = () => {
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
      api.get(`/api/boq/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.createdBy);
        // Recalculate grand total
        const total = res.data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        setGrandTotal(total);
      });
    } else {
      setCreator(user);
      // Start with one empty item
      setForm({ ...form, items: [{ description: '', quantity: 1, unit: '', rate: '', amount: '', notes: '' }] });
    }
  }, [id, user]);

  // Recalculate amounts and grand total whenever items change
  useEffect(() => {
    const itemsWithAmount = form.items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      return { ...item, amount: amount || '' };
    });
    const total = itemsWithAmount.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setGrandTotal(total);
    // Update form items with computed amounts (but don't trigger another effect)
    setForm(prev => ({ ...prev, items: itemsWithAmount }));
  }, [form.items.map(item => `${item.quantity}-${item.rate}`).join()]); // Only recalc when qty or rate changes

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit: '', rate: '', amount: '', notes: '' }]
    });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure amounts are numbers
    const itemsToSubmit = form.items.map(item => ({
      ...item,
      amount: parseFloat(item.amount) || 0,
      quantity: parseFloat(item.quantity) || 0,
      rate: parseFloat(item.rate) || 0
    }));
    const payload = { ...form, items: itemsToSubmit };
    try {
      if (id) await api.put(`/api/boq/${id}`, payload);
      else await api.post('/api/boq', payload);
      navigate('/boq');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">{id ? 'Edit BOQ' : 'Create BOQ'}</Typography>
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

        <Typography variant="subtitle1" sx={{ mt: 2 }}>BOQ Items</Typography>
        {form.items.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Description"
              value={item.description}
              onChange={e => handleItemChange(idx, 'description', e.target.value)}
              required
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Qty"
              type="number"
              value={item.quantity}
              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
              sx={{ width: 80 }}
            />
            <TextField
              label="Unit"
              value={item.unit}
              onChange={e => handleItemChange(idx, 'unit', e.target.value)}
              sx={{ width: 80 }}
            />
            <TextField
              label="Rate"
              type="number"
              value={item.rate}
              onChange={e => handleItemChange(idx, 'rate', e.target.value)}
              sx={{ width: 100 }}
            />
            <TextField
              label="Amount"
              type="number"
              value={item.amount}
              InputProps={{ readOnly: true }}
              sx={{ width: 120, bgcolor: '#f0f0f0' }}
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
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save BOQ</Button>
      </form>
    </Paper>
  );
};

export default BOQForm;
