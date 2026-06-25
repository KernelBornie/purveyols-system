import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip, Card, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CalculateIcon from '@mui/icons-material/Calculate';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import ConversionTool from '../../components/ConversionTool';

const TEMPLATES = [
  { value: 'Zanaco Bank', label: '🏦 Zanaco Bank' },
  { value: 'Residential House', label: '🏠 Residential House' },
  { value: 'Commercial Building', label: '🏢 Commercial Building' },
  { value: 'Road Construction', label: '🛣️ Road Construction' },
  { value: 'Bridge Construction', label: '🌉 Bridge Construction' },
  { value: 'Water Reticulation', label: '💧 Water Reticulation' },
  { value: 'Custom', label: '⚙️ Custom' },
];

const DEFAULT_PRELIMINARIES = {
  title: 'PRELIMINARY AND GENERAL ITEMS',
  description: 'All contract preliminaries and general clauses',
  items: [
    { description: 'Site establishment and demobilization', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Site hoardings and security', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Insurance and performance security', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Portable water supply', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Compliance with environmental clauses', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Contract name signs', unit: 'no', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Material testing (provisional)', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
    { description: 'Personal Protective Equipment (PPE)', unit: 'lump', quantity: 1, rate: 0, amount: 0, notes: '' },
  ],
};

const BOQForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [conversionOpen, setConversionOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [form, setForm] = useState({
    project: '',
    name: '',
    description: '',
    clientName: '',
    clientAddress: '',
    projectLocation: '',
    tendererName: '',
    tendererAddress: '',
    tenderDate: new Date().toISOString().split('T')[0],
    exchangeRate: 1,
    sections: [],
    subTotal: 0,
    percentageAdjustment: 0,
    contingencies: 10,
    vat: 16,
    grandTotal: 0,
    status: 'draft',
    templateName: '',
  });
  const [message, setMessage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(null);
  const [itemForm, setItemForm] = useState({ description: '', unit: '', quantity: 1, rate: 0, notes: '' });

  const canEdit = ['admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant', 'foreman'].includes(user?.role);

  const ensurePreliminaries = (sections) => {
    const hasPrelim = sections.some(s => 
      s.title?.toLowerCase().includes('preliminary') || 
      s.title?.toLowerCase().includes('prelim')
    );
    if (!hasPrelim) {
      return [DEFAULT_PRELIMINARIES, ...sections];
    }
    return sections;
  };

  useEffect(() => {
    const saved = localStorage.getItem('customBOQTemplates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        setCustomTemplates([]);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const projRes = await api.get('/api/projects');
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        if (id) {
          const boqRes = await api.get(`/api/boq/${id}`);
          const data = boqRes.data;
          setForm({
            project: data.project?._id || data.project || '',
            name: data.name || '',
            description: data.description || '',
            clientName: data.clientName || '',
            clientAddress: data.clientAddress || '',
            projectLocation: data.projectLocation || '',
            tendererName: data.tendererName || '',
            tendererAddress: data.tendererAddress || '',
            tenderDate: data.tenderDate ? data.tenderDate.split('T')[0] : new Date().toISOString().split('T')[0],
            exchangeRate: data.exchangeRate || 1,
            sections: data.sections || [],
            subTotal: data.subTotal || 0,
            percentageAdjustment: data.percentageAdjustment || 0,
            contingencies: data.contingencies || 10,
            vat: data.vat || 16,
            grandTotal: data.grandTotal || 0,
            status: data.status || 'draft',
            templateName: data.templateName || '',
          });
          setSelectedTemplate(data.templateName || '');
        } else {
          setSelectedTemplate('Custom');
          setForm(prev => ({
            ...prev,
            sections: ensurePreliminaries([]),
            templateName: 'Custom',
          }));
          setMessage({ type: 'info', text: 'Default preliminaries added. Load a template or edit as needed.' });
        }
        setMessage(null);
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const loadTemplate = async (templateName) => {
    if (!templateName || templateName === 'Custom') {
      setForm(prev => ({
        ...prev,
        sections: ensurePreliminaries(prev.sections),
        templateName: '',
      }));
      setSelectedTemplate('Custom');
      return;
    }
    const custom = customTemplates.find(t => t.name === templateName);
    if (custom) {
      const sections = ensurePreliminaries(custom.sections || []);
      setForm(prev => ({
        ...prev,
        sections: sections,
        templateName: templateName,
        name: custom.name || prev.name,
        description: custom.description || prev.description,
      }));
      setSelectedTemplate(templateName);
      setMessage({ type: 'success', text: `Loaded custom template "${templateName}"` });
      return;
    }
    try {
      const res = await api.get(`/api/boq/templates/${templateName}`);
      const template = res.data;
      const sections = ensurePreliminaries(template.sections || []);
      setForm(prev => ({
        ...prev,
        sections: sections,
        templateName: templateName,
        name: template.name || prev.name,
        description: template.description || prev.description,
      }));
      setSelectedTemplate(templateName);
      setMessage({ type: 'success', text: `Loaded ${templateName} template` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load template' });
    }
  };

  const saveCustomTemplates = (templates) => {
    localStorage.setItem('customBOQTemplates', JSON.stringify(templates));
    setCustomTemplates(templates);
  };

  const saveAsTemplate = () => {
    const templateName = prompt('Enter a name for this custom template:');
    if (!templateName) return;
    if (customTemplates.some(t => t.name === templateName)) {
      if (!window.confirm(`A template named "${templateName}" already exists. Overwrite?`)) return;
    }
    const newTemplate = {
      name: templateName,
      description: form.description || `Custom template: ${templateName}`,
      sections: form.sections.map(s => ({
        title: s.title,
        description: s.description || '',
        items: s.items.map(item => ({
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          rate: 0,
          amount: 0,
          notes: item.notes || '',
        })),
      })),
    };
    const updatedTemplates = customTemplates.filter(t => t.name !== templateName);
    updatedTemplates.push(newTemplate);
    saveCustomTemplates(updatedTemplates);
    setMessage({ type: 'success', text: `Template "${templateName}" saved!` });
  };

  const deleteCustomTemplate = (templateName) => {
    if (!window.confirm(`Delete custom template "${templateName}"?`)) return;
    const updatedTemplates = customTemplates.filter(t => t.name !== templateName);
    saveCustomTemplates(updatedTemplates);
    if (selectedTemplate === templateName) {
      setSelectedTemplate('');
      setForm(prev => ({ ...prev, sections: ensurePreliminaries([]), templateName: '' }));
    }
    setMessage({ type: 'success', text: `Template "${templateName}" deleted` });
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionForm({ title: '', description: '' });
    setSectionDialog(true);
  };

  const handleEditSection = (index) => {
    setEditingSection(index);
    setSectionForm(form.sections[index]);
    setSectionDialog(true);
  };

  const handleSaveSection = () => {
    const newSection = {
      title: sectionForm.title,
      description: sectionForm.description || '',
      items: [],
      order: form.sections.length,
    };
    if (editingSection !== null) {
      const sections = [...form.sections];
      sections[editingSection] = { ...sections[editingSection], ...sectionForm };
      setForm({ ...form, sections });
    } else {
      setForm({ ...form, sections: [...form.sections, newSection] });
    }
    setSectionDialog(false);
  };

  const handleDeleteSection = (index) => {
    const sections = form.sections.filter((_, i) => i !== index);
    setForm({ ...form, sections });
  };

  const handleAddItem = (sectionIndex) => {
    setCurrentSectionIndex(sectionIndex);
    setEditingItem(null);
    setItemForm({ description: '', unit: '', quantity: 1, rate: 0, notes: '' });
    setItemDialog(true);
  };

  const handleEditItem = (sectionIndex, itemIndex) => {
    setCurrentSectionIndex(sectionIndex);
    setEditingItem(itemIndex);
    setItemForm(form.sections[sectionIndex].items[itemIndex]);
    setItemDialog(true);
  };

  const handleSaveItem = () => {
    const sections = [...form.sections];
    const items = sections[currentSectionIndex].items || [];
    const newItem = {
      description: itemForm.description,
      unit: itemForm.unit || 'lump',
      quantity: parseFloat(itemForm.quantity) || 1,
      rate: parseFloat(itemForm.rate) || 0,
      amount: (parseFloat(itemForm.quantity) || 1) * (parseFloat(itemForm.rate) || 0),
      notes: itemForm.notes || '',
    };
    if (editingItem !== null) {
      items[editingItem] = newItem;
    } else {
      items.push(newItem);
    }
    sections[currentSectionIndex].items = items;
    setForm({ ...form, sections });
    setItemDialog(false);
    recalculateTotals();
  };

  const handleDeleteItem = (sectionIndex, itemIndex) => {
    const sections = [...form.sections];
    sections[sectionIndex].items = sections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setForm({ ...form, sections });
    recalculateTotals();
  };

  const recalculateTotals = () => {
    let subTotal = 0;
    form.sections.forEach(section => {
      section.items.forEach(item => {
        item.amount = (item.quantity || 0) * (item.rate || 0);
        subTotal += item.amount;
      });
    });
    const adj = (form.percentageAdjustment || 0) / 100;
    const subTotalAdj = subTotal * (1 + adj);
    const contingencies = subTotalAdj * ((form.contingencies || 0) / 100);
    const vat = (subTotalAdj + contingencies) * ((form.vat || 0) / 100);
    const grandTotal = subTotalAdj + contingencies + vat;
    setForm(prev => ({ ...prev, subTotal, grandTotal }));
  };

  useEffect(() => {
    recalculateTotals();
  }, [form.sections, form.percentageAdjustment, form.contingencies, form.vat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      payload.sections = form.sections.map(s => ({
        title: s.title,
        description: s.description || '',
        items: s.items.map(item => ({
          description: item.description,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0,
          notes: item.notes || '',
        })),
      }));
      if (id) {
        await api.put(`/api/boq/${id}`, payload);
        setMessage({ type: 'success', text: 'BOQ updated!' });
      } else {
        await api.post('/api/boq', payload);
        setMessage({ type: 'success', text: 'BOQ created!' });
      }
      setTimeout(() => navigate('/boq'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csv = 'Section,Description,Unit,Quantity,Rate,Amount\n';
    form.sections.forEach(section => {
      section.items.forEach(item => {
        csv += `${section.title},${item.description},${item.unit},${item.quantity},${item.rate},${item.amount}\n`;
      });
    });
    csv += `\nSub-Total,,,${form.subTotal}\n`;
    csv += `Contingencies (${form.contingencies}%),,,${form.contingencies * form.subTotal / 100}\n`;
    csv += `VAT (${form.vat}%),,,${form.vat * form.subTotal / 100}\n`;
    csv += `GRAND TOTAL,,,${form.grandTotal}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOQ_${form.name || 'untitled'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();
  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  const formatDate = (date) => date ? new Date(date).toLocaleString() : '—';

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading BOQ...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>You have view‑only access.</Alert>}

      <form onSubmit={handleSubmit}>
        {/* ─── Company Header – both lines red ───────────────────── */}
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img
            src="/top-log.PNG?t=3"
            alt="PURVEYOLS Logo"
            style={{ height: '60px', maxWidth: '100%' }}
            onError={(e) => e.target.style.display = 'none'}
          />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>
            PURVEYOLS
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>
            Building and Civil contractors
          </Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        {/* Document Title & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>BILL OF QUANTITIES</Typography>
          <Box>
            <Button variant="outlined" startIcon={<CalculateIcon />} onClick={() => setConversionOpen(true)} sx={{ mr: 1 }}>
              Conversions
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField select label="Project *" fullWidth size="small" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} required disabled={!canEdit}>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="BOQ Name *" fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={!canEdit} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={2} size="small" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={!canEdit} />
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="BOQ Template"
                fullWidth
                size="small"
                value={selectedTemplate}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedTemplate(val);
                  if (val === 'Custom') {
                    setForm(prev => ({ ...prev, sections: ensurePreliminaries(prev.sections), templateName: '' }));
                  } else {
                    loadTemplate(val);
                  }
                }}
                disabled={!canEdit}
              >
                <MenuItem value="Custom">⚙️ Custom</MenuItem>
                {TEMPLATES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
                {customTemplates.length > 0 && [
                  <Divider key="divider" />,
                  ...customTemplates.map(t => (
                    <MenuItem key={t.name} value={t.name}>📁 {t.name}</MenuItem>
                  ))
                ]}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {canEdit && (
                <>
                  <Button variant="outlined" onClick={saveAsTemplate} size="small">
                    💾 Save as Template
                  </Button>
                  {selectedTemplate && customTemplates.some(t => t.name === selectedTemplate) && (
                    <Button variant="outlined" color="error" onClick={() => deleteCustomTemplate(selectedTemplate)} size="small">
                      🗑️ Delete Template
                    </Button>
                  )}
                </>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField label="Client Name" fullWidth size="small" value={form.clientName || ''} onChange={e => setForm({ ...form, clientName: e.target.value })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Client Address" fullWidth size="small" value={form.clientAddress || ''} onChange={e => setForm({ ...form, clientAddress: e.target.value })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Project Location" fullWidth size="small" value={form.projectLocation || ''} onChange={e => setForm({ ...form, projectLocation: e.target.value })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Tender Date" type="date" fullWidth size="small" value={form.tenderDate} onChange={e => setForm({ ...form, tenderDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={!canEdit} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Sections ────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections</Typography>
            {canEdit && (
              <Button startIcon={<AddIcon />} onClick={handleAddSection} variant="outlined" size="small">
                Add Section
              </Button>
            )}
          </Box>

          {form.sections.map((section, idx) => (
            <Paper key={idx} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{section.title}</Typography>
                  {section.description && <Typography variant="caption" display="block" color="textSecondary">{section.description}</Typography>}
                </Box>
                {canEdit && (
                  <Box>
                    <IconButton size="small" onClick={() => handleEditSection(idx)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteSection(idx)}><DeleteIcon fontSize="small" /></IconButton>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddItem(idx)}>Add Item</Button>
                  </Box>
                )}
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Rate (ZMW)</TableCell>
                    <TableCell align="right">Amount (ZMW)</TableCell>
                    <TableCell>Notes</TableCell>
                    {canEdit && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(section.items || []).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.notes}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditItem(idx, i)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteItem(idx, i)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(section.items || []).length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center">No items in this section.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          ))}
          {form.sections.length === 0 && (
            <Typography align="center" color="textSecondary" sx={{ py: 3 }}>No sections yet. Add a section or load a template.</Typography>
          )}
        </Paper>

        {/* ─── Financial Summary ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Financial Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField label="Sub Total" type="number" fullWidth size="small" value={form.subTotal} InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Percentage Adjustment (%)" type="number" fullWidth size="small" value={form.percentageAdjustment} onChange={e => setForm({ ...form, percentageAdjustment: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Contingencies (%)" type="number" fullWidth size="small" value={form.contingencies} onChange={e => setForm({ ...form, contingencies: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="VAT (%)" type="number" fullWidth size="small" value={form.vat} onChange={e => setForm({ ...form, vat: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Grand Total" type="number" fullWidth size="small" value={form.grandTotal} InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Exchange Rate" type="number" fullWidth size="small" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 1 })} disabled={!canEdit} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Approval ────────────────────────────────────────────── */}
        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Prepared by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{user?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formatDate(new Date())}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {form.status === 'approved' ? (
              <>
                <Typography variant="body2">Approved by: _________________</Typography>
                <Typography variant="body2">Date: _________________</Typography>
              </>
            ) : (
              <>
                <Typography variant="body2">Approved by: _________________</Typography>
                <Typography variant="body2">Date: _________________</Typography>
              </>
            )}
          </Box>
        </Box>

        {/* ─── Buttons ────────────────────────────────────────────────── */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save BOQ'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV}>Export CSV</Button>
          <Button variant="outlined" onClick={() => navigate('/boq')}>Cancel</Button>
        </Box>
      </form>

      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSection !== null ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <TextField label="Section Title *" fullWidth margin="dense" value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} required />
          <TextField label="Description" fullWidth margin="dense" value={sectionForm.description} onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSection}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialog} onClose={() => setItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem !== null ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <TextField label="Description *" fullWidth margin="dense" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} required />
          <TextField label="Unit" fullWidth margin="dense" value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="e.g., m², no, lump" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Quantity" type="number" fullWidth margin="dense" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Rate (ZMW)" type="number" fullWidth margin="dense" value={itemForm.rate} onChange={e => setItemForm({ ...itemForm, rate: parseFloat(e.target.value) || 0 })} />
            </Grid>
          </Grid>
          <TextField label="Notes" fullWidth margin="dense" value={itemForm.notes} onChange={e => setItemForm({ ...itemForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConversionTool open={conversionOpen} onClose={() => setConversionOpen(false)} />
    </Paper>
  );
};

export default BOQForm;