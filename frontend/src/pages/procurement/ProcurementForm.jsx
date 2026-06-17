import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TextField, Button, Paper, Typography, MenuItem, IconButton, Box,
  Table, TableHead, TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

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
      <BackButton />
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

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Requested Materials/Items</Typography>

        {/* Items Table */}
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit Price (ZMW)</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {form.items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <TextField
                    size="small"
                    value={item.name}
                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                    placeholder="e.g., Cement"
                    fullWidth
                    required
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.unitPrice}
                    onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                    sx={{ width: 100 }}
                    placeholder="blank"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.total}
                    InputProps={{ readOnly: true }}
                    sx={{ width: 100, bgcolor: '#f0f0f0' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={item.supplier}
                    onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                    placeholder="Supplier"
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
            Add Item
          </Button>
          <Typography variant="h6">
            Grand Total: <strong>{(grandTotal || 0).toFixed(2)}</strong>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained">Save Order</Button>
          <Button variant="outlined" onClick={() => navigate('/procurement')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ProcurementForm;
