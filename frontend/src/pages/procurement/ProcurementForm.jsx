import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const ProcurementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project: '',
    items: [],
    status: 'pending',
    orderNumber: '',
    preparedBy: '',
    approvedBy: '',
    authorisedBy: '',
    preparedSign: '',
    approvedSign: '',
    authorisedSign: '',
  });
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState(null);

  // Generate order number if new
  const generateOrderNumber = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${y}${m}${d}-${rand}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

        if (id) {
          const orderRes = await api.get(`/api/procurement/${id}`);
          const data = orderRes.data;
          setForm({
            project: data.project || '',
            items: Array.isArray(data.items) ? data.items : [],
            status: data.status || 'pending',
            orderNumber: data.orderNumber || '',
            preparedBy: data.preparedBy || '',
            approvedBy: data.approvedBy || '',
            authorisedBy: data.authorisedBy || '',
            preparedSign: data.preparedSign || '',
            approvedSign: data.approvedSign || '',
            authorisedSign: data.authorisedSign || '',
          });
          setCreator(data.createdBy);
        } else {
          setCreator(user);
          setForm(prev => ({
            ...prev,
            orderNumber: generateOrderNumber(),
            preparedBy: user?.name || '',
            items: [
              { description: '', unit: '', quantity: 1, unitPrice: 0, total: 0, supplier: '' }
            ]
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };

    fetchData();
  }, [id, user]);

  const calculateTotals = () => {
    const items = Array.isArray(form.items) ? form.items : [];
    let itemsWithTotal = [];
    let grandTotal = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = quantity * unitPrice;
      itemsWithTotal.push({ ...item, total });
      grandTotal += total;
    });

    return { itemsWithTotal, grandTotal };
  };

  const totals = calculateTotals();

  const handleItemChange = (index, field, value) => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    if (!items[index]) return;

    items[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(items[index].quantity) || 0;
      const unitPrice = parseFloat(items[index].unitPrice) || 0;
      items[index].total = quantity * unitPrice;
    }

    setForm({ ...form, items });
  };

  const addItem = () => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    setForm({
      ...form,
      items: [
        ...items,
        { description: '', unit: '', quantity: 1, unitPrice: 0, total: 0, supplier: '' }
      ]
    });
  };

  const removeItem = (index) => {
    const items = Array.isArray(form.items) ? [...form.items] : [];
    if (items.length <= 1) {
      setMessage({ type: 'warning', text: 'Must have at least one item.' });
      return;
    }
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const items = Array.isArray(form.items) ? form.items : [];
      const payload = {
        project: form.project,
        items: items.map(item => ({
          description: item.description,
          unit: item.unit || '',
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
          supplier: item.supplier || '',
        })),
        status: form.status,
        orderNumber: form.orderNumber,
        preparedBy: form.preparedBy,
        approvedBy: form.approvedBy,
        authorisedBy: form.authorisedBy,
        preparedSign: form.preparedSign,
        approvedSign: form.approvedSign,
        authorisedSign: form.authorisedSign,
        grandTotal: totals.grandTotal,
      };

      if (id) {
        await api.put(`/api/procurement/${id}`, payload);
        setMessage({ type: 'success', text: 'Order updated successfully!' });
      } else {
        await api.post('/api/procurement', payload);
        setMessage({ type: 'success', text: 'Order created successfully!' });
      }
      setTimeout(() => navigate('/procurement'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save order' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  const items = Array.isArray(form.items) ? form.items : [];

  return (
    <Paper sx={{ p: 3, maxWidth: '1000px', mx: 'auto' }}>
      <BackButton />

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* ===== COMPANY HEADER (Matches physical note) ===== */}
        <Box sx={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          pb: 2,
          mb: 2,
          '@media print': { borderBottom: '2px solid #000' }
        }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
            PURVEYOLS
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Building and Civil Construction
          </Typography>
          <Typography variant="body2">
            Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lucknow, Zanzibar
          </Typography>
          <Typography variant="body2">
            Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879
          </Typography>
          <Typography variant="body2">
            Email: purveyols@gmail.com
          </Typography>
        </Box>

        {/* ===== DOCUMENT TITLE & ORDER NUMBER ===== */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          borderBottom: '1px solid #000',
          pb: 1
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            MATERIAL REQUISITION NOTE
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            No. {form.orderNumber || 'NEW'}
          </Typography>
        </Box>

        {/* ===== CREATOR INFO ===== */}
        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by (you): <strong>{creator.name}</strong> ({creator.role})
            </Typography>
          </Box>
        )}

        {/* ===== PROJECT SELECTION ===== */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              select
              label="Project *"
              fullWidth
              size="small"
              value={form.project || ''}
              onChange={e => setForm({ ...form, project: e.target.value })}
              required
            >
              {Array.isArray(projects) && projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* ===== MATERIALS TABLE (with Supplier column) ===== */}
        <Box sx={{ mt: 2, overflowX: 'auto' }}>
          <Table size="small" sx={{ border: '1px solid #000' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>
                  DESCRIPTION
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '80px' }}>
                  UNIT
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '70px' }}>
                  QTY
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '120px' }}>
                  UNIT PRICE
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '120px' }}>
                  TOTAL
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '130px' }}>
                  SUPPLIER
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', width: '60px' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, border: '1px solid #000' }}>
                    No items added yet. Click "Add Row" to add items.
                  </TableCell>
                </TableRow>
              ) : (
                totals.itemsWithTotal.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.description || ''}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        placeholder=""
                        sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.unit || ''}
                        onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                        placeholder=""
                        sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.quantity || 0}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.unitPrice || 0}
                        onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1, bgcolor: '#fafafa' }}>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={item.total || 0}
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiInputBase-root': { border: 'none', bgcolor: '#fafafa', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.supplier || ''}
                        onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                        placeholder="Supplier"
                        sx={{ '& .MuiInputBase-root': { border: 'none', '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', p: 1, textAlign: 'center' }}>
                      <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {/* ===== ADD ROW BUTTON ===== */}
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem} size="small">
            Add Row
          </Button>
        </Box>

        {/* ===== GRAND TOTAL ===== */}
        <Box sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '2px solid #000',
          pt: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            GRAND TOTAL: {formatCurrency(totals.grandTotal)}
          </Typography>
        </Box>

        {/* ===== APPROVAL SECTION (Matches physical note) ===== */}
        <Box sx={{
          mt: 4,
          borderTop: '1px solid #000',
          pt: 3,
        }}>
          <Grid container spacing={2}>
            {/* Prepared By */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>PREPARED BY:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.preparedBy || ''}
                  onChange={e => setForm({ ...form, preparedBy: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">SIGN:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.preparedSign || ''}
                  onChange={e => setForm({ ...form, preparedSign: e.target.value })}
                  placeholder="_______________"
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
            </Grid>

            {/* Approved By */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>APPROVED BY:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.approvedBy || ''}
                  onChange={e => setForm({ ...form, approvedBy: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">SIGN:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.approvedSign || ''}
                  onChange={e => setForm({ ...form, approvedSign: e.target.value })}
                  placeholder="_______________"
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
            </Grid>

            {/* Authorised By */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>AUTHORISED BY:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.authorisedBy || ''}
                  onChange={e => setForm({ ...form, authorisedBy: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">SIGN:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.authorisedSign || ''}
                  onChange={e => setForm({ ...form, authorisedSign: e.target.value })}
                  placeholder="_______________"
                  sx={{ '& .MuiInputBase-root': { borderBottom: '1px solid #000', borderRadius: 0, '&:before': { borderBottom: 'none' }, '&:after': { borderBottom: 'none' } } }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ===== STATUS & ACTIONS ===== */}
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Status"
            size="small"
            sx={{ width: 150 }}
            value={form.status || 'pending'}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="funded">Funded</MenuItem>
            <MenuItem value="purchased">Purchased</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </TextField>
          {form.status === 'pending' && <Chip label="Pending" color="warning" size="small" />}
          {form.status === 'funded' && <Chip label="Funded" color="info" size="small" />}
          {form.status === 'purchased' && <Chip label="Purchased" color="success" size="small" />}
          {form.status === 'delivered' && <Chip label="Delivered" color="primary" size="small" />}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Order'}
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate('/procurement')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ProcurementForm;
