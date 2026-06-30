import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  MenuItem, Divider, Alert, Chip, Card, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails,
  Avatar, Tooltip, Backdrop
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    documents: [],
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [approver, setApprover] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(null);
  const [itemForm, setItemForm] = useState({ description: '', unit: '', quantity: 1, rate: 0, notes: '' });
  const [docExpanded, setDocExpanded] = useState(true);
  const [docEditDialog, setDocEditDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docForm, setDocForm] = useState({ name: '' });

  const canEdit = ['admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant', 'foreman'].includes(user?.role);
  const isReadOnly = !canEdit || form.status === 'approved';

  // ─── Helper: get file URL ──────────────────────────────────────────
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (api.defaults.baseURL) return `${api.defaults.baseURL}${path}`;
    if (process.env.REACT_APP_API_URL) return `${process.env.REACT_APP_API_URL}${path}`;
    return `${window.location.origin}${path}`;
  };

  // ─── Document handlers ─────────────────────────────────────────────
  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!id) {
      setMessage({ type: 'warning', text: 'Please save the BOQ first before uploading documents.' });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      const res = await api.post(`/api/boq/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({
        ...prev,
        documents: [...prev.documents, res.data.document],
      }));
      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    }
    e.target.value = '';
  };

  const handleDocDelete = async (index) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      await api.delete(`/api/boq/${id}/documents/${index}`);
      const docs = [...form.documents];
      docs.splice(index, 1);
      setForm(prev => ({ ...prev, documents: docs }));
      setMessage({ type: 'success', text: 'Document removed' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Delete failed' });
    }
  };

  const handleDocEdit = (doc, index) => {
    setEditingDoc(index);
    setDocForm({ name: doc.name || '' });
    setDocEditDialog(true);
  };

  const handleDocSave = async () => {
    try {
      await api.put(`/api/boq/${id}/documents/${editingDoc}`, { name: docForm.name });
      const docs = [...form.documents];
      docs[editingDoc].name = docForm.name;
      setForm(prev => ({ ...prev, documents: docs }));
      setDocEditDialog(false);
      setMessage({ type: 'success', text: 'Document updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    }
  };

  // ─── Rest of the component ──────────────────────────────────────────
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
            documents: data.documents || [],
          });
          setSelectedTemplate(data.templateName || '');
          setCreator(data.createdBy);
          setCreatedAt(data.createdAt);
          setApprover(data.approvedBy);
          setApprovedAt(data.approvedAt);
        } else {
          setSelectedTemplate('Custom');
          setForm(prev => ({
            ...prev,
            sections: ensurePreliminaries([]),
            templateName: 'Custom',
          }));
          setMessage({ type: 'info', text: 'Default preliminaries added. Load a template or edit as needed.' });
          setCreator(user);
          setCreatedAt(new Date().toISOString());
        }
        setMessage(null);
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

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
    if (isReadOnly) return;
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
        const res = await api.post('/api/boq', payload);
        // After creation, redirect to edit mode so documents can be uploaded
        navigate(`/boq/${res.data._id}/edit`);
        return;
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

  const handlePrint = () => {
    const filledSections = form.sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.description && item.description.trim() !== '')
      }))
      .filter(section => section.items.length > 0);

    if (filledSections.length === 0) {
      alert('No items to print. Please add at least one item with a description.');
      return;
    }

    let subTotal = 0;
    filledSections.forEach(section => {
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

    const formatCurrency = (amount) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill of Quantities - ${form.name || 'BOQ'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            .print-container { max-width: 1000px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c; }
            .header .subtitle { font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c; }
            .header .details { font-size: 11px; margin: 1px 0; }
            .title-row { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 15px; }
            .title-row .left { font-weight: bold; font-size: 20px; letter-spacing: 2px; }
            .client-info { margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 20px; }
            .client-info .block { flex: 1; min-width: 200px; }
            .client-info .block .label { font-size: 11px; font-weight: bold; }
            .section-title { font-weight: bold; font-size: 14px; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
            .section-desc { font-size: 11px; color: #555; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0 15px; }
            th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; font-size: 11px; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary { margin-top: 15px; border-top: 1px solid #000; padding-top: 10px; }
            .summary .row { display: flex; justify-content: flex-end; padding: 3px 0; }
            .summary .label { font-weight: bold; width: 200px; text-align: right; padding-right: 20px; }
            .summary .value { width: 150px; text-align: right; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 5px; }
            .approval { margin-top: 30px; border-top: 1px solid #000; padding-top: 15px; }
            .approval .row { display: flex; justify-content: space-between; }
            .approval .block { text-align: center; flex: 1; }
            .approval .block .line { border-top: 1px solid #000; width: 150px; margin: 20px auto 0; padding-top: 4px; font-size: 10px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; }
            .no-print { display: none; }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>PURVEYOLS</h1>
              <div class="subtitle">Building and Civil contractors</div>
              <div class="details">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</div>
              <div class="details">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</div>
              <div class="details">Email: purveyols@gmail.com</div>
            </div>
            <div class="title-row">
              <span class="left">BILL OF QUANTITIES</span>
            </div>
            <div class="client-info">
              ${form.project ? `<div class="block"><div class="label">Project:</div> <div>${projects.find(p => p._id === form.project)?.name || 'N/A'}</div></div>` : ''}
              ${form.clientName ? `<div class="block"><div class="label">Client Name:</div> <div>${form.clientName}</div></div>` : ''}
              ${form.clientAddress ? `<div class="block"><div class="label">Client Address:</div> <div>${form.clientAddress}</div></div>` : ''}
              ${form.projectLocation ? `<div class="block"><div class="label">Project Location:</div> <div>${form.projectLocation}</div></div>` : ''}
              ${form.tenderDate ? `<div class="block"><div class="label">Tender Date:</div> <div>${new Date(form.tenderDate).toLocaleDateString()}</div></div>` : ''}
            </div>
            ${filledSections.map(section => `
              <div class="section-title">${section.title}</div>
              ${section.description ? `<div class="section-desc">${section.description}</div>` : ''}
              <table>
                <thead>
                  <tr><th style="width:40%">Description</th><th style="width:10%">Qty</th><th style="width:10%">Unit</th><th style="width:15%">Rate (ZMW)</th><th style="width:15%">Amount (ZMW)</th><th style="width:10%">Notes</th></tr>
                </thead>
                <tbody>
                  ${section.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-center">${item.unit || '—'}</td>
                      <td class="text-right">${item.rate.toFixed(2)}</td>
                      <td class="text-right">${item.amount.toFixed(2)}</td>
                      <td>${item.notes || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `).join('')}
            <div class="summary">
              <div class="row"><span class="label">Sub Total</span><span class="value">${formatCurrency(subTotal)}</span></div>
              ${form.percentageAdjustment ? `<div class="row"><span class="label">Percentage Adjustment (${form.percentageAdjustment}%)</span><span class="value">${formatCurrency(subTotal * adj)}</span></div>` : ''}
              ${form.contingencies ? `<div class="row"><span class="label">Contingencies (${form.contingencies}%)</span><span class="value">${formatCurrency(contingencies)}</span></div>` : ''}
              ${form.vat ? `<div class="row"><span class="label">VAT (${form.vat}%)</span><span class="value">${formatCurrency(vat)}</span></div>` : ''}
              <div class="row grand-total"><span class="label">GRAND TOTAL</span><span class="value">${formatCurrency(grandTotal)}</span></div>
            </div>
            <div class="approval">
              <div class="row">
                <div class="block">
                  <strong>Prepared by:</strong>
                  <div class="line">${creator?.name || '_________________'}</div>
                </div>
                <div class="block">
                  <strong>Date:</strong>
                  <div class="line">${createdAt ? new Date(createdAt).toLocaleString() : '_________________'}</div>
                </div>
              </div>
              <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                <div class="block">
                  <strong>Approved by:</strong>
                  <div class="line">${approver ? `${approver.name} (${approver.role})` : '_________________'}</div>
                </div>
                <div class="block">
                  <strong>Date:</strong>
                  <div class="line">${approvedAt ? new Date(approvedAt).toLocaleString() : '_________________'}</div>
                </div>
              </div>
            </div>
            <div class="footer">PURVEYOLS CMS - Construction Management System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
      {isReadOnly && <Alert severity="info" sx={{ mb: 2 }}>This BOQ is read‑only.</Alert>}

      <form onSubmit={handleSubmit}>
        {/* ─── Company Header ───────────────────────────────────── */}
        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
          <img src="/top-log.PNG?t=3" alt="PURVEYOLS Logo" style={{ height: '60px', maxWidth: '100%' }} onError={(e) => e.target.style.display = 'none'} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2, color: '#b71c1c' }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>Building and Civil contractors</Typography>
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
            <TextField select label="Project *" fullWidth size="small" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} required disabled={isReadOnly}>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="BOQ Name *" fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={isReadOnly} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={2} size="small" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={isReadOnly} />
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
                disabled={isReadOnly}
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
              {!isReadOnly && (
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
              <TextField label="Client Name" fullWidth size="small" value={form.clientName || ''} onChange={e => setForm({ ...form, clientName: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Client Address" fullWidth size="small" value={form.clientAddress || ''} onChange={e => setForm({ ...form, clientAddress: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Project Location" fullWidth size="small" value={form.projectLocation || ''} onChange={e => setForm({ ...form, projectLocation: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Tender Date" type="date" fullWidth size="small" value={form.tenderDate} onChange={e => setForm({ ...form, tenderDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Documents Section (with guard) ───────────────────────── */}
        <Paper sx={{ p: 2, mb: 2, border: '2px solid #1976d2', backgroundColor: '#f5f9ff' }}>
          <Accordion expanded={docExpanded} onChange={() => setDocExpanded(!docExpanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                📄 Documents ({form.documents?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {!isReadOnly && (
                <Box sx={{ mb: 2 }}>
                  {id ? (
                    <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                      Upload Document
                      <input type="file" hidden onChange={handleDocUpload} />
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Please save the BOQ first before uploading documents.
                    </Alert>
                  )}
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                    Supported: images, PDF, Word, Excel (max 50MB)
                  </Typography>
                </Box>
              )}
              {form.documents && form.documents.length > 0 ? (
                form.documents.map((doc, idx) => {
                  const fullUrl = getFileUrl(doc.path);
                  const isImage = doc.mimeType?.startsWith('image/');
                  const isPdf = doc.mimeType === 'application/pdf';
                  return (
                    <Box key={idx} sx={{ mb: 2, border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{doc.name}</Typography>
                          <Typography variant="caption" display="block" color="textSecondary">
                            {doc.mimeType || 'Unknown'} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!isReadOnly && id && (
                            <>
                              <Tooltip title="Edit name">
                                <IconButton size="small" onClick={() => handleDocEdit(doc, idx)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDocDelete(idx)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Download">
                            <IconButton size="small" component="a" href={fullUrl} target="_blank" download>
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1, bgcolor: '#fff', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                        {isImage ? (
                          <Box sx={{ textAlign: 'center', maxHeight: '300px', overflow: 'auto' }}>
                            <img src={fullUrl} alt={doc.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                          </Box>
                        ) : isPdf ? (
                          <Box sx={{ height: '400px' }}>
                            <iframe src={fullUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={doc.name} />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="body2" color="textSecondary">Preview not available for this file type.</Typography>
                            <Button component="a" href={fullUrl} target="_blank" variant="contained" sx={{ mt: 1 }}>Download</Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" color="textSecondary">No documents uploaded.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* ─── Sections ────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections</Typography>
            {!isReadOnly && (
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
                {!isReadOnly && (
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
                    {!isReadOnly && <TableCell>Actions</TableCell>}
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
                      {!isReadOnly && (
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
              <TextField label="Percentage Adjustment (%)" type="number" fullWidth size="small" value={form.percentageAdjustment} onChange={e => setForm({ ...form, percentageAdjustment: parseFloat(e.target.value) || 0 })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Contingencies (%)" type="number" fullWidth size="small" value={form.contingencies} onChange={e => setForm({ ...form, contingencies: parseFloat(e.target.value) || 0 })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="VAT (%)" type="number" fullWidth size="small" value={form.vat} onChange={e => setForm({ ...form, vat: parseFloat(e.target.value) || 0 })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Grand Total" type="number" fullWidth size="small" value={form.grandTotal} InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Exchange Rate" type="number" fullWidth size="small" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 1 })} disabled={isReadOnly} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Approval ────────────────────────────────────────────── */}
        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Prepared by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {creator ? `${creator.name} (${creator.role})` : '—'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {createdAt ? `Date: ${formatDate(createdAt)}` : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {createdAt ? formatDate(createdAt) : '—'}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {approver ? (
              <>
                <Typography variant="body2">
                  Approved by: <strong>{approver.name}</strong> ({approver.role})
                </Typography>
                <Typography variant="body2">
                  Approved on: <strong>{formatDate(approvedAt)}</strong>
                </Typography>
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
          {!isReadOnly && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save BOQ'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV}>Export CSV</Button>
          <Button variant="outlined" onClick={() => navigate('/boq')}>Cancel</Button>
        </Box>
      </form>

      {/* ─── Dialogs ────────────────────────────────────────────────── */}
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

      <Dialog open={docEditDialog} onClose={() => setDocEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document Name</DialogTitle>
        <DialogContent>
          <TextField
            label="Document Name"
            fullWidth
            margin="dense"
            value={docForm.name}
            onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDocSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConversionTool open={conversionOpen} onClose={() => setConversionOpen(false)} />
    </Paper>
  );
};

export default BOQForm;