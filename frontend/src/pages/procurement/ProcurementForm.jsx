import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, Chip, IconButton, Tooltip, Table, TableHead, TableRow,
  TableCell, TableBody, Checkbox, FormControlLabel
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
  const printRef = useRef();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    project: '',
    orderNumber: '',
    items: [
      { description: '', quantity: 1, unitPrice: 0, supplier: '', notes: '' }
    ],
    preparedBy: '',
    approvedBy: '',
    authorisedBy: '',
    preparedSign: false,
    approvedSign: false,
    authorisedSign: false,
    grandTotal: 0,
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  // ─── Fetch data ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        if (id) {
          const res = await api.get(`/api/procurement/${id}`);
          const data = res.data;
          setForm({
            project: data.project?._id || data.project || '',
            orderNumber: data.orderNumber || '',
            items: data.items || [{ description: '', quantity: 1, unitPrice: 0, supplier: '', notes: '' }],
            preparedBy: data.preparedBy || '',
            approvedBy: data.approvedBy || '',
            authorisedBy: data.authorisedBy || '',
            preparedSign: data.preparedSign || false,
            approvedSign: data.approvedSign || false,
            authorisedSign: data.authorisedSign || false,
            grandTotal: data.grandTotal || 0,
          });
          setCreator(data.createdBy);
          setCreatedAt(data.createdAt);
        } else {
          setCreator(user);
          setCreatedAt(new Date().toISOString());
          // Generate order number
          const today = new Date();
          const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
          const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          setForm(prev => ({ ...prev, orderNumber: `MRN-${dateStr}-${random}` }));
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id, user]);

  // ─── Calculate grand total ─────────────────────────────────────
  const calculateGrandTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // ─── Item handlers ─────────────────────────────────────────────
  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unitPrice: 0, supplier: '', notes: '' }]
    });
  };

  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  // ─── Handle submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        project: form.project,
        items: form.items.filter(item => item.description.trim() !== ''),
        grandTotal: calculateGrandTotal(),
      };
      if (id) {
        await api.put(`/api/procurement/${id}`, payload);
        setMessage({ type: 'success', text: 'Requisition updated!' });
      } else {
        await api.post('/api/procurement', payload);
        setMessage({ type: 'success', text: 'Requisition created!' });
      }
      setTimeout(() => navigate('/procurement'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Print – only visible filled content ──────────────────────
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Material Requisition Note</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .title { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
            .title h2 { margin: 0; }
            .meta { margin-bottom: 15px; }
            .meta p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 12px; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 10px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
            .signatures .sign { text-align: center; }
            .signatures .sign .line { border-top: 1px solid #000; width: 150px; margin-top: 30px; padding-top: 5px; }
            .hidden-print { display: none; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Filter items – only show filled ones ────────────────────
  const getFilledItems = () => {
    return form.items.filter(item => item.description && item.description.trim() !== '');
  };

  const grandTotal = calculateGrandTotal();
  const filledItems = getFilledItems();

  // ─── Check if any signature is selected ──────────────────────
  const hasSelectedSignature = form.preparedSign || form.approvedSign || form.authorisedSign;

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {id ? 'Edit Requisition' : 'MATERIAL REQUISITION NOTE'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
            className="no-print"
          >
            Print
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
            className="no-print"
          >
            {loading ? 'Saving...' : 'Save Requisition'}
          </Button>
        </Box>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* ─── Print Content ───────────────────────────────────────── */}
      <div ref={printRef}>
        {/* Company Header - always shown */}
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Building and Civil Construction</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        {/* Document Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            MATERIAL REQUISITION NOTE
          </Typography>
          {form.orderNumber && (
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              No. {form.orderNumber}
            </Typography>
          )}
        </Box>

        {/* Creator Info - only if creator exists */}
        {creator && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Created by: <strong>{creator.name}</strong> ({creator.role})
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created on: {createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Project - only if selected */}
        {form.project && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Project: <strong>{projects.find(p => p._id === form.project)?.name || 'N/A'}</strong>
            </Typography>
          </Box>
        )}

        {/* Items Table - only if there are filled items */}
        {filledItems.length > 0 && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filledItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">K {item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">K {(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>{item.supplier || '—'}</TableCell>
                    <TableCell>{item.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ textAlign: 'right', mt: 2 }}>
              <Typography variant="h6">
                Grand Total: <strong>K {grandTotal.toFixed(2)}</strong>
              </Typography>
            </Box>
          </>
        )}

        {/* Signatures - only if at least one is selected */}
        {hasSelectedSignature && (
          <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
            <Grid container spacing={2}>
              {form.preparedSign && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">Prepared by:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {form.preparedBy || 'N/A'} ✓
                  </Typography>
                </Grid>
              )}
              {form.approvedSign && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">Approved by:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {form.approvedBy || 'N/A'} ✓
                  </Typography>
                </Grid>
              )}
              {form.authorisedSign && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">Authorised by:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {form.authorisedBy || 'N/A'} ✓
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </div>

      {/* ─── Edit Form (hidden in print) ────────────────────────── */}
      <Box className="no-print">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Project *"
                fullWidth
                size="small"
                value={form.project}
                onChange={e => setForm({ ...form, project: e.target.value })}
                required
              >
                {Array.isArray(projects) && projects.map(p => (
                  <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Order Number"
                fullWidth
                size="small"
                value={form.orderNumber}
                onChange={e => setForm({ ...form, orderNumber: e.target.value })}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>

          {/* Items Table */}
          <Typography variant="h6" gutterBottom>Items</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.supplier}
                      onChange={e => updateItem(idx, 'supplier', e.target.value)}
                      placeholder="Supplier"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={item.notes}
                      onChange={e => updateItem(idx, 'notes', e.target.value)}
                      placeholder="Notes"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeItem(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button
            startIcon={<AddIcon />}
            onClick={addItem}
            variant="outlined"
            sx={{ mt: 1 }}
          >
            Add Row
          </Button>

          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Typography variant="h6">
              Grand Total: <strong>K {grandTotal.toFixed(2)}</strong>
            </Typography>
          </Box>

          {/* Signatures */}
          <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Prepared By"
                  fullWidth
                  size="small"
                  value={form.preparedBy}
                  onChange={e => setForm({ ...form, preparedBy: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.preparedSign}
                      onChange={e => setForm({ ...form, preparedSign: e.target.checked })}
                    />
                  }
                  label="Signed"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Approved By"
                  fullWidth
                  size="small"
                  value={form.approvedBy}
                  onChange={e => setForm({ ...form, approvedBy: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.approvedSign}
                      onChange={e => setForm({ ...form, approvedSign: e.target.checked })}
                    />
                  }
                  label="Signed"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Authorised By"
                  fullWidth
                  size="small"
                  value={form.authorisedBy}
                  onChange={e => setForm({ ...form, authorisedBy: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.authorisedSign}
                      onChange={e => setForm({ ...form, authorisedSign: e.target.checked })}
                    />
                  }
                  label="Signed"
                />
              </Grid>
            </Grid>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default ProcurementForm;