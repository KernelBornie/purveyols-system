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

// ─── Template options ──────────────────────────────────────────────
const TEMPLATES = [
  { value: 'Zanaco Bank', label: '🏦 Zanaco Bank' },
  { value: 'Residential House', label: '🏠 Residential House' },
  { value: 'Commercial Building', label: '🏢 Commercial Building' },
  { value: 'Road Construction', label: '🛣️ Road Construction' },
  { value: 'Bridge Construction', label: '🌉 Bridge Construction' },
  { value: 'Water Reticulation', label: '💧 Water Reticulation' },
  { value: 'Custom', label: '⚙️ Custom' },
];

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

  // ─── Load custom templates from localStorage ──────────────────────
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

  // ─── Fetch data ──────────────────────────────────────────────────
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
          // Default template on new BOQ
          setSelectedTemplate('Zanaco Bank');
          loadTemplate('Zanaco Bank');
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

  // ─── Load template ──────────────────────────────────────────────
  const loadTemplate = async (templateName) => {
    if (!templateName || templateName === 'Custom') {
      setForm(prev => ({ ...prev, sections: [], templateName: '' }));
      return;
    }
    // Check if it's a custom template first
    const custom = customTemplates.find(t => t.name === templateName);
    if (custom) {
      setForm(prev => ({
        ...prev,
        sections: custom.sections || [],
        templateName: templateName,
        name: custom.name || prev.name,
        description: custom.description || prev.description,
      }));
      setMessage({ type: 'success', text: `Loaded custom template "${templateName}"` });
      return;
    }
    // Otherwise fetch from backend
    try {
      const res = await api.get(`/api/boq/templates/${templateName}`);
      const template = res.data;
      setForm(prev => ({
        ...prev,
        sections: template.sections || [],
        templateName: templateName,
        name: template.name || prev.name,
        description: template.description || prev.description,
      }));
      setMessage({ type: 'success', text: `Loaded ${templateName} template` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load template' });
    }
  };

  // ─── Save custom templates to localStorage ────────────────────────
  const saveCustomTemplates = (templates) => {
    localStorage.setItem('customBOQTemplates', JSON.stringify(templates));
    setCustomTemplates(templates);
  };

  // ─── Save current BOQ as a custom template ────────────────────────
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
          rate: 0, // Reset rates when saving as template
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

  // ─── Delete a custom template ──────────────────────────────────────
  const deleteCustomTemplate = (templateName) => {
    if (!window.confirm(`Delete custom template "${templateName}"?`)) return;
    const updatedTemplates = customTemplates.filter(t => t.name !== templateName);
    saveCustomTemplates(updatedTemplates);
    if (selectedTemplate === templateName) {
      setSelectedTemplate('');
      setForm(prev => ({ ...prev, sections: [], templateName: '' }));
    }
    setMessage({ type: 'success', text: `Template "${templateName}" deleted` });
  };

  // ─── Section handlers ────────────────────────────────────────────
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

  // ─── Item handlers ──────────────────────────────────────────────
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

  // ─── Totals calculation ──────────────────────────────────────────
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

  // ─── Submit ──────────────────────────────────────────────────────
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

  // ─── Export CSV ──────────────────────────────────────────────────
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
        {/* Company Header with Logo + Fallback */}
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img
            src="/top-log.jpeg"
            alt="PURVEYOLS Logo"
            style={{ height: '80px', maxWidth: '100%' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              for (let i = 0; i < parent.children.length; i++) {
                const el = parent.children[i];
                if (el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'P') {
                  el.style.display = 'block';
                }
              }
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, display: 'none' }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'none' }}>Building and Civil Construction</Typography>
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

        {/* Rest of the form unchanged */}
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
                    setForm(prev => ({ ...prev, sections: [], templateName: '' }));
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

        {/* Sections and remaining content unchanged */}
        {/* ... (rest of the file, including sections, financial summary, approval, buttons, dialogs, ConversionTool) ... */}
      </form>
    </Paper>
  );
};

export default BOQForm;