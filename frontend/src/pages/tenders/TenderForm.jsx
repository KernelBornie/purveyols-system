import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Table, TableHead,
  TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, FormControlLabel, Checkbox,
  InputAdornment, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

// ─── Expanded roles that can edit ───────────────────────────────
const EDITABLE_ROLES = [
  'admin', 'director', 'procurement-officer', 'accountant',
  'civil-engineer', 'quantity-surveyor', 'foreman', 'safety-officer',
  'engineer', 'manager', 'supervisor', 'planner', 'estimator',
  'surveyor', 'architect', 'project-manager', 'site-engineer',
  'construction-manager', 'quality-control', 'store-keeper'
];

const DELETABLE_ROLES = ['admin', 'director', 'accountant'];

const TenderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    referenceNumber: '',
    solicitationNumber: '',
    projectName: '',
    location: '',
    client: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    clientContact: '',
    type: 'solicitation',
    issueDate: '',
    dueDate: '',
    siteVisitDate: '',
    awardDate: '',
    isSF1442: false,
    contractingOffice: '',
    facilityCode: '',
    isBondRequired: false,
    bondDays: 10,
    acceptanceDays: 30,
    sections: [],
    description: '',
    priceProposal: {
      subtotal: 0,
      percentageAdjustment: 0,
      contingencies: 0,
      vat: 0,
      grandTotal: 0,
      currency: 'ZMW',
      exchangeRate: 1,
    },
    volumeI: {
      sf1442Received: false,
      priceBreakdown: '',
    },
    volumeII: {
      performanceSchedule: '',
      keyPersonnel: [],
      managementInformation: {
        bidderInfo: '',
        samRegistration: '',
        certifications: '',
        litigationStatus: '',
        politicalAffiliation: '',
        equipmentSchedule: '',
        companyProfile: '',
      },
      financialCapability: {
        bankStatements: [],
      },
      pastPerformance: [],
      preliminarySafetyPlan: '',
    },
    documents: [],
    image: '',
    status: 'draft',
    notes: '',
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [convertedToProject, setConvertedToProject] = useState(null);

  // ─── Dialogs ──────────────────────────────────────────────
  const [personnelDialog, setPersonnelDialog] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [performanceDialog, setPerformanceDialog] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const canDelete = DELETABLE_ROLES.includes(user?.role);
  const isReadOnly = form.status === 'submitted' || form.status === 'awarded' || !canEdit;

  // ─── Image handlers ──────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, GIF, and WEBP allowed.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setForm({ ...form, image: compressedBase64 });
        setImagePreview(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm({ ...form, image: '' });
    setImagePreview(null);
  };

  const handlePhotoClick = () => {
    if (imagePreview) setPhotoPreviewOpen(true);
  };

  // ─── NEW: Convert to Project ──────────────────────────────────
  const handleConvertToProject = async () => {
    if (!window.confirm('Create a project from this awarded tender?')) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/tenders/${id}/convert-to-project`);
      setMessage({ type: 'success', text: `✅ Project "${res.data.project.name}" created!` });
      setConvertedToProject(res.data.project._id);
      // Optionally navigate to the new project
      // navigate(`/projects/${res.data.project._id}`);
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to create project') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        if (id) {
          const res = await api.get(`/api/tenders/${id}`);
          const data = res.data;
          setForm({
            title: data.title || '',
            referenceNumber: data.referenceNumber || '',
            solicitationNumber: data.solicitationNumber || '',
            projectName: data.projectName || '',
            location: data.location || '',
            client: data.client || '',
            clientAddress: data.clientAddress || '',
            clientEmail: data.clientEmail || '',
            clientPhone: data.clientPhone || '',
            clientContact: data.clientContact || '',
            type: data.type || 'solicitation',
            issueDate: data.issueDate ? new Date(data.issueDate).toISOString().split('T')[0] : '',
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
            siteVisitDate: data.siteVisitDate ? new Date(data.siteVisitDate).toISOString().split('T')[0] : '',
            awardDate: data.awardDate ? new Date(data.awardDate).toISOString().split('T')[0] : '',
            isSF1442: data.isSF1442 || false,
            contractingOffice: data.contractingOffice || '',
            facilityCode: data.facilityCode || '',
            isBondRequired: data.isBondRequired || false,
            bondDays: data.bondDays || 10,
            acceptanceDays: data.acceptanceDays || 30,
            sections: data.sections || [],
            description: data.description || '',
            priceProposal: data.priceProposal || {
              subtotal: 0,
              percentageAdjustment: 0,
              contingencies: 0,
              vat: 0,
              grandTotal: 0,
              currency: 'ZMW',
              exchangeRate: 1,
            },
            volumeI: data.volumeI || {
              sf1442Received: false,
              priceBreakdown: '',
            },
            volumeII: {
              performanceSchedule: data.volumeII?.performanceSchedule || '',
              keyPersonnel: data.volumeII?.keyPersonnel || [],
              managementInformation: data.volumeII?.managementInformation || {
                bidderInfo: '',
                samRegistration: '',
                certifications: '',
                litigationStatus: '',
                politicalAffiliation: '',
                equipmentSchedule: '',
                companyProfile: '',
              },
              financialCapability: {
                bankStatements: data.volumeII?.financialCapability?.bankStatements || [],
              },
              pastPerformance: data.volumeII?.pastPerformance || [],
              preliminarySafetyPlan: data.volumeII?.preliminarySafetyPlan || '',
            },
            documents: data.documents || [],
            image: data.image || '',
            status: data.status || 'draft',
            notes: data.notes || '',
          });
          if (data.image) setImagePreview(data.image);
          setCreator(data.createdBy);
          setCreatedAt(data.createdAt);
          setConvertedToProject(data.convertedToProject || null);
        }
      } catch (err) {
        setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to load tender') });
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  // ─── Calculate totals ──────────────────────────────────────────
  const calculateGrandTotal = () => {
    let itemsTotal = 0;
    form.sections.forEach(section => {
      section.items.forEach(item => {
        itemsTotal += (item.quantity * item.unitPrice);
      });
    });
    const subtotal = itemsTotal;
    const adjustment = (subtotal * (form.priceProposal.percentageAdjustment || 0)) / 100;
    const contingencies = (subtotal * (form.priceProposal.contingencies || 0)) / 100;
    const vat = (subtotal * (form.priceProposal.vat || 0)) / 100;
    const grandTotal = subtotal + adjustment + contingencies + vat;
    return { subtotal, grandTotal };
  };

  // ─── Section handlers ──────────────────────────────────────────
  const addSection = () => {
    setEditingSection({
      name: '',
      description: '',
      items: [{ description: '', quantity: 1, unit: 'Lot', unitPrice: 0, total: 0 }],
      pageNumber: form.sections.length + 1,
    });
    setSectionDialog(true);
  };

  const saveSection = () => {
    if (!editingSection.name) {
      alert('Please enter a section name.');
      return;
    }
    if (editingSection._id) {
      const sections = form.sections.map(s => s._id === editingSection._id ? editingSection : s);
      setForm({ ...form, sections });
    } else {
      setForm({ ...form, sections: [...form.sections, { ...editingSection, _id: Date.now().toString() }] });
    }
    setSectionDialog(false);
    setEditingSection(null);
  };

  const deleteSection = (index) => {
    const sections = form.sections.filter((_, i) => i !== index);
    setForm({ ...form, sections });
  };

  // ─── Item handlers (within section) ────────────────────────────
  const addItemToSection = (sectionIndex) => {
    const sections = [...form.sections];
    sections[sectionIndex].items.push({ description: '', quantity: 1, unit: 'Lot', unitPrice: 0, total: 0 });
    setForm({ ...form, sections });
  };

  const removeItemFromSection = (sectionIndex, itemIndex) => {
    const sections = [...form.sections];
    sections[sectionIndex].items = sections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setForm({ ...form, sections });
  };

  const updateSectionItem = (sectionIndex, itemIndex, field, value) => {
    const sections = [...form.sections];
    sections[sectionIndex].items[itemIndex][field] = value;
    sections[sectionIndex].items[itemIndex].total = sections[sectionIndex].items[itemIndex].quantity * sections[sectionIndex].items[itemIndex].unitPrice;
    setForm({ ...form, sections });
  };

  // ─── Key Personnel handlers ──────────────────────────────────
  const addPersonnel = () => {
    setEditingPersonnel({ name: '', role: '', qualifications: '', experience: '', yearsWithFirm: 0 });
    setPersonnelDialog(true);
  };

  const savePersonnel = () => {
    if (!editingPersonnel.name || !editingPersonnel.role) {
      alert('Please enter name and role.');
      return;
    }
    if (editingPersonnel._id) {
      const keyPersonnel = form.volumeII.keyPersonnel.map(p => p._id === editingPersonnel._id ? editingPersonnel : p);
      setForm({ ...form, volumeII: { ...form.volumeII, keyPersonnel } });
    } else {
      setForm({
        ...form,
        volumeII: {
          ...form.volumeII,
          keyPersonnel: [...form.volumeII.keyPersonnel, { ...editingPersonnel, _id: Date.now().toString() }]
        }
      });
    }
    setPersonnelDialog(false);
    setEditingPersonnel(null);
  };

  const deletePersonnel = (index) => {
    const keyPersonnel = form.volumeII.keyPersonnel.filter((_, i) => i !== index);
    setForm({ ...form, volumeII: { ...form.volumeII, keyPersonnel } });
  };

  // ─── Past Performance handlers ──────────────────────────────
  const addPerformance = () => {
    setEditingPerformance({ projectName: '', client: '', value: '', yearCompleted: '', description: '', isReference: false });
    setPerformanceDialog(true);
  };

  const savePerformance = () => {
    if (!editingPerformance.projectName || !editingPerformance.client) {
      alert('Please enter project name and client.');
      return;
    }
    if (editingPerformance._id) {
      const pastPerformance = form.volumeII.pastPerformance.map(p => p._id === editingPerformance._id ? editingPerformance : p);
      setForm({ ...form, volumeII: { ...form.volumeII, pastPerformance } });
    } else {
      setForm({
        ...form,
        volumeII: {
          ...form.volumeII,
          pastPerformance: [...form.volumeII.pastPerformance, { ...editingPerformance, _id: Date.now().toString() }]
        }
      });
    }
    setPerformanceDialog(false);
    setEditingPerformance(null);
  };

  const deletePerformance = (index) => {
    const pastPerformance = form.volumeII.pastPerformance.filter((_, i) => i !== index);
    setForm({ ...form, volumeII: { ...form.volumeII, pastPerformance } });
  };

  // ─── Delete tender ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this tender permanently?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/tenders/${id}`);
      setMessage({ type: 'success', text: 'Tender deleted' });
      setTimeout(() => navigate('/tenders'), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Delete failed') });
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit / Save ────────────────────────────────────────────
  const handleSubmit = async (submitForSubmission = false) => {
    setLoading(true);
    setMessage(null);
    try {
      const { subtotal, grandTotal } = calculateGrandTotal();
      const payload = {
        ...form,
        priceProposal: {
          ...form.priceProposal,
          subtotal,
          grandTotal,
        }
      };
      if (id) {
        await api.put(`/api/tenders/${id}`, payload);
        if (submitForSubmission) {
          await api.put(`/api/tenders/${id}/submit`);
          setMessage({ type: 'success', text: 'Tender submitted!' });
        } else {
          setMessage({ type: 'success', text: 'Tender updated!' });
        }
      } else {
        const res = await api.post('/api/tenders', payload);
        if (submitForSubmission) {
          await api.put(`/api/tenders/${res.data._id}/submit`);
          setMessage({ type: 'success', text: 'Tender created and submitted!' });
        } else {
          setMessage({ type: 'success', text: 'Tender created!' });
        }
      }
      setTimeout(() => navigate('/tenders'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to save') });
    } finally {
      setLoading(false);
    }
  };

  // ─── Custom Print ────────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.title) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    const photoHtml = imagePreview ? `<img src="${imagePreview}" style="max-width:200px; border:1px solid #ccc; margin:5px 0;" />` : '';
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>Tender / RFQ</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
            .print-container { max-width: 1000px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c; }
            .header .subtitle { font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c; }
            .header .details { font-size: 11px; margin: 1px 0; }
            .title-row { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; }
            .title-row .left { font-weight: bold; font-size: 18px; letter-spacing: 2px; color: #b71c1c; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; font-size: 12px; }
            .approval { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
            .approval .row { display: flex; justify-content: space-between; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
            th { background: #f0f0f0; border: 1px solid #000; padding: 4px; text-align: left; }
            td { border: 1px solid #000; padding: 4px; }
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
              <span class="left">TENDER / RFQ</span>
            </div>
            <div class="info">
              ${photoHtml ? `<div class="photo-container">${photoHtml}</div>` : ''}
              <p><strong>Reference:</strong> ${form.referenceNumber || '—'}</p>
              <p><strong>Title:</strong> ${form.title}</p>
              <p><strong>Project Name:</strong> ${form.projectName || '—'}</p>
              <p><strong>Location:</strong> ${form.location || '—'}</p>
              <p><strong>Client:</strong> ${form.client}</p>
              <p><strong>Client Address:</strong> ${form.clientAddress || '—'}</p>
              <p><strong>Client Email:</strong> ${form.clientEmail || '—'}</p>
              <p><strong>Client Phone:</strong> ${form.clientPhone || '—'}</p>
              <p><strong>Type:</strong> ${form.type}</p>
              <p><strong>Issue Date:</strong> ${form.issueDate || '—'}</p>
              <p><strong>Due Date:</strong> ${form.dueDate || '—'}</p>
              <p><strong>Status:</strong> ${form.status}</p>
              <p><strong>Description:</strong> ${form.description || '—'}</p>
              ${creator ? `<p><strong>Created by:</strong> ${creator.name} (${creator.role})</p>` : ''}
              ${createdAt ? `<p><strong>Created on:</strong> ${new Date(createdAt).toLocaleString()}</p>` : ''}
            </div>
            ${form.sections && form.sections.length > 0 ? `
              <h3>Sections & Items</h3>
              ${form.sections.map((sec, idx) => `
                <h4>${sec.name}</h4>
                ${sec.description ? `<p>${sec.description}</p>` : ''}
                <table>
                  <thead>
                    <tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    ${sec.items.map((item, i) => `
                      <tr>
                        <td>${i+1}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td>${formatCurrency(item.total)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `).join('')}
              <p><strong>Subtotal:</strong> ${formatCurrency(calculateGrandTotal().subtotal)}</p>
              <p><strong>Grand Total:</strong> ${formatCurrency(calculateGrandTotal().grandTotal)}</p>
            ` : ''}
            <div class="approval">
              <div class="row">
                <div><strong>Approved by:</strong> _________________</div>
                <div><strong>Date:</strong> _________________</div>
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

  const { subtotal, grandTotal } = calculateGrandTotal();

  if (fetching) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {id ? (isReadOnly ? 'View Tender' : 'Edit Tender') : 'New Tender / RFQ'}
        </Typography>
        <Box className="no-print">
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>

          {id && canDelete && !isReadOnly && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ mr: 1 }}
            >
              Delete
            </Button>
          )}

          {id && form.status === 'awarded' && !convertedToProject && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleConvertToProject}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Create Project
            </Button>
          )}
          {convertedToProject && (
            <Chip label="✅ Project Created" color="success" sx={{ mr: 1 }} />
          )}

          {!isReadOnly && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => handleSubmit(true)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Submit
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                Save Draft
              </Button>
            </>
          )}
        </Box>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {isReadOnly && form.status === 'submitted' && (
        <Alert severity="info" sx={{ mb: 2 }}>This tender has been submitted. Edits are disabled.</Alert>
      )}
      {form.status === 'awarded' && (
        <Alert severity="success" sx={{ mb: 2 }}>This tender has been awarded!</Alert>
      )}

      <form>
        {/* ─── Image Upload ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Tender Image</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar
              src={imagePreview || '/tender-placeholder.jpg'}
              sx={{ width: 100, height: 100, borderRadius: 2, border: '1px solid #ccc', cursor: imagePreview ? 'pointer' : 'default' }}
              variant="rounded"
              onClick={handlePhotoClick}
            />
            {!isReadOnly && canEdit && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CameraAltIcon />}
                >
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" hidden onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={removeImage}>
                    Remove
                  </Button>
                )}
              </>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">JPEG, PNG, GIF, WEBP</Typography>
        </Paper>

        {/* ─── Basic Info ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title *"
                fullWidth
                size="small"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Solicitation Number"
                fullWidth
                size="small"
                value={form.solicitationNumber}
                onChange={(e) => setForm({ ...form, solicitationNumber: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Project Name"
                fullWidth
                size="small"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Location"
                fullWidth
                size="small"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Type"
                fullWidth
                size="small"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={isReadOnly}
              >
                <MenuItem value="solicitation">Solicitation</MenuItem>
                <MenuItem value="rfq">RFQ</MenuItem>
                <MenuItem value="tender">Tender</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem>
                <MenuItem value="bid">Bid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={isReadOnly}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="not_awarded">Not Awarded</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Client Info ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Client Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client *"
                fullWidth
                size="small"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                required
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Address"
                fullWidth
                size="small"
                value={form.clientAddress}
                onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Email"
                fullWidth
                size="small"
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Phone"
                fullWidth
                size="small"
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Client Contact Person"
                fullWidth
                size="small"
                value={form.clientContact}
                onChange={(e) => setForm({ ...form, clientContact: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Dates ────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Important Dates</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Issue Date"
                type="date"
                fullWidth
                size="small"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                size="small"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Site Visit Date"
                type="date"
                fullWidth
                size="small"
                value={form.siteVisitDate}
                onChange={(e) => setForm({ ...form, siteVisitDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Award Date"
                type="date"
                fullWidth
                size="small"
                value={form.awardDate}
                onChange={(e) => setForm({ ...form, awardDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── SF1442 / US Embassy Specific ────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>SF 1442 / US Embassy Specific</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isSF1442}
                    onChange={(e) => setForm({ ...form, isSF1442: e.target.checked })}
                    disabled={isReadOnly}
                  />
                }
                label="Is this an SF 1442 (US Embassy) tender?"
              />
            </Grid>
            {form.isSF1442 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contracting Office"
                    fullWidth
                    size="small"
                    value={form.contractingOffice}
                    onChange={(e) => setForm({ ...form, contractingOffice: e.target.value })}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Facility Code"
                    fullWidth
                    size="small"
                    value={form.facilityCode}
                    onChange={(e) => setForm({ ...form, facilityCode: e.target.value })}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.isBondRequired}
                        onChange={(e) => setForm({ ...form, isBondRequired: e.target.checked })}
                        disabled={isReadOnly}
                      />
                    }
                    label="Bond Required?"
                  />
                </Grid>
                {form.isBondRequired && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Bond Days"
                        type="number"
                        fullWidth
                        size="small"
                        value={form.bondDays}
                        onChange={(e) => setForm({ ...form, bondDays: parseInt(e.target.value) || 0 })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Acceptance Days"
                        type="number"
                        fullWidth
                        size="small"
                        value={form.acceptanceDays}
                        onChange={(e) => setForm({ ...form, acceptanceDays: parseInt(e.target.value) || 0 })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </Paper>

        {/* ─── Description ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Description / Scope of Work</Typography>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            size="small"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isReadOnly}
          />
        </Paper>

        {/* ─── Sections & Items ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections & Items</Typography>
            {!isReadOnly && (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addSection}>
                Add Section
              </Button>
            )}
          </Box>
          {form.sections.map((section, sectionIndex) => (
            <Paper key={section._id || sectionIndex} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1"><strong>{section.name}</strong></Typography>
                {!isReadOnly && (
                  <IconButton size="small" color="error" onClick={() => deleteSection(sectionIndex)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              {section.description && <Typography variant="body2">{section.description}</Typography>}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {section.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.description}
                          onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'description', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'quantity', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.unit}
                          onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'unit', e.target.value)}
                          disabled={isReadOnly}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>{item.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        {!isReadOnly && (
                          <IconButton size="small" color="error" onClick={() => removeItemFromSection(sectionIndex, itemIndex)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isReadOnly && (
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addItemToSection(sectionIndex)} sx={{ mt: 1 }}>
                  Add Item
                </Button>
              )}
            </Paper>
          ))}
          {form.sections.length === 0 && (
            <Typography variant="body2" color="textSecondary">No sections added yet.</Typography>
          )}
        </Paper>

        {/* ─── Price Proposal ──────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Price Proposal</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Subtotal"
                type="number"
                fullWidth
                size="small"
                value={subtotal}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Percentage Adjustment (%)"
                type="number"
                fullWidth
                size="small"
                value={form.priceProposal.percentageAdjustment}
                onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, percentageAdjustment: parseFloat(e.target.value) || 0 } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Contingencies (%)"
                type="number"
                fullWidth
                size="small"
                value={form.priceProposal.contingencies}
                onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, contingencies: parseFloat(e.target.value) || 0 } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="VAT (%)"
                type="number"
                fullWidth
                size="small"
                value={form.priceProposal.vat}
                onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, vat: parseFloat(e.target.value) || 0 } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Grand Total"
                type="number"
                fullWidth
                size="small"
                value={grandTotal}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Currency"
                fullWidth
                size="small"
                value={form.priceProposal.currency}
                onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, currency: e.target.value } })}
                disabled={isReadOnly}
              >
                <MenuItem value="ZMW">ZMW</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Volume I: SF1442 Price Proposal ────────────────────── */}
        {form.isSF1442 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Volume I: Price Proposal (SF 1442)</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.volumeI.sf1442Received}
                  onChange={(e) => setForm({ ...form, volumeI: { ...form.volumeI, sf1442Received: e.target.checked } })}
                  disabled={isReadOnly}
                />
              }
              label="SF 1442 Received?"
            />
            <TextField
              label="Price Breakdown (Summary)"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.volumeI.priceBreakdown}
              onChange={(e) => setForm({ ...form, volumeI: { ...form.volumeI, priceBreakdown: e.target.value } })}
              disabled={isReadOnly}
              sx={{ mt: 2 }}
            />
          </Paper>
        )}

        {/* ─── Volume II: Business/Technical ──────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Volume II: Business & Technical</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Performance Schedule"
                fullWidth
                multiline
                rows={2}
                size="small"
                value={form.volumeII.performanceSchedule}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, performanceSchedule: e.target.value } })}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Key Personnel ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Key Personnel</Typography>
            {!isReadOnly && (
              <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={addPersonnel}>
                Add Personnel
              </Button>
            )}
          </Box>
          {form.volumeII.keyPersonnel.map((person, idx) => (
            <Paper key={person._id || idx} sx={{ p: 2, mb: 1, border: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2">{person.name}</Typography>
                  <Typography variant="caption" display="block">Role: {person.role}</Typography>
                  <Typography variant="caption" display="block">Qualifications: {person.qualifications}</Typography>
                  <Typography variant="caption" display="block">Experience: {person.experience}</Typography>
                  <Typography variant="caption" display="block">Years with Firm: {person.yearsWithFirm}</Typography>
                </Box>
                {!isReadOnly && (
                  <IconButton size="small" color="error" onClick={() => deletePersonnel(idx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))}
          {form.volumeII.keyPersonnel.length === 0 && (
            <Typography variant="body2" color="textSecondary">No personnel added.</Typography>
          )}
        </Paper>

        {/* ─── Management Information ──────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Management Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Bidder Info"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.bidderInfo}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, bidderInfo: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="SAM Registration"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.samRegistration}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, samRegistration: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Certifications"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.certifications}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, certifications: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Litigation Status"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.litigationStatus}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, litigationStatus: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Political Affiliation"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.politicalAffiliation}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, politicalAffiliation: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Equipment Schedule"
                fullWidth
                size="small"
                value={form.volumeII.managementInformation.equipmentSchedule}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, equipmentSchedule: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company Profile"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={form.volumeII.managementInformation.companyProfile}
                onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, companyProfile: e.target.value } } })}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Past Performance ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Past Performance</Typography>
            {!isReadOnly && (
              <Button variant="outlined" startIcon={<WorkIcon />} onClick={addPerformance}>
                Add Performance
              </Button>
            )}
          </Box>
          {form.volumeII.pastPerformance.map((perf, idx) => (
            <Paper key={perf._id || idx} sx={{ p: 2, mb: 1, border: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2">{perf.projectName}</Typography>
                  <Typography variant="caption" display="block">Client: {perf.client}</Typography>
                  <Typography variant="caption" display="block">Value: {perf.value}</Typography>
                  <Typography variant="caption" display="block">Year Completed: {perf.yearCompleted}</Typography>
                  <Typography variant="caption" display="block">Description: {perf.description}</Typography>
                  {perf.isReference && <Chip label="Reference" size="small" color="info" />}
                </Box>
                {!isReadOnly && (
                  <IconButton size="small" color="error" onClick={() => deletePerformance(idx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))}
          {form.volumeII.pastPerformance.length === 0 && (
            <Typography variant="body2" color="textSecondary">No past performance entries.</Typography>
          )}
        </Paper>

        {/* ─── Preliminary Safety Plan ────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Preliminary Safety Plan</Typography>
          <TextField
            label="Safety Plan"
            fullWidth
            multiline
            rows={4}
            size="small"
            value={form.volumeII.preliminarySafetyPlan}
            onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, preliminarySafetyPlan: e.target.value } })}
            disabled={isReadOnly}
          />
        </Paper>

        {/* ─── Notes ────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Notes</Typography>
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={isReadOnly}
          />
        </Paper>

        {id && creator && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" display="block">Created by: {creator.name} ({creator.role})</Typography>
            <Typography variant="caption" display="block">Created at: {new Date(createdAt).toLocaleString()}</Typography>
          </Box>
        )}
      </form>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tender Image</span>
          <IconButton onClick={() => setPhotoPreviewOpen(false)}>
            <ZoomInIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Tender"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Personnel Dialog ────────────────────────────────────── */}
      <Dialog open={personnelDialog} onClose={() => setPersonnelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPersonnel?._id ? 'Edit Personnel' : 'Add Personnel'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name *"
            fullWidth
            margin="dense"
            value={editingPersonnel?.name || ''}
            onChange={(e) => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })}
          />
          <TextField
            label="Role *"
            fullWidth
            margin="dense"
            value={editingPersonnel?.role || ''}
            onChange={(e) => setEditingPersonnel({ ...editingPersonnel, role: e.target.value })}
          />
          <TextField
            label="Qualifications"
            fullWidth
            margin="dense"
            value={editingPersonnel?.qualifications || ''}
            onChange={(e) => setEditingPersonnel({ ...editingPersonnel, qualifications: e.target.value })}
          />
          <TextField
            label="Experience"
            fullWidth
            margin="dense"
            value={editingPersonnel?.experience || ''}
            onChange={(e) => setEditingPersonnel({ ...editingPersonnel, experience: e.target.value })}
          />
          <TextField
            label="Years with Firm"
            type="number"
            fullWidth
            margin="dense"
            value={editingPersonnel?.yearsWithFirm || 0}
            onChange={(e) => setEditingPersonnel({ ...editingPersonnel, yearsWithFirm: parseInt(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPersonnelDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePersonnel}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Performance Dialog ────────────────────────────────────── */}
      <Dialog open={performanceDialog} onClose={() => setPerformanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPerformance?._id ? 'Edit Performance' : 'Add Performance'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name *"
            fullWidth
            margin="dense"
            value={editingPerformance?.projectName || ''}
            onChange={(e) => setEditingPerformance({ ...editingPerformance, projectName: e.target.value })}
          />
          <TextField
            label="Client *"
            fullWidth
            margin="dense"
            value={editingPerformance?.client || ''}
            onChange={(e) => setEditingPerformance({ ...editingPerformance, client: e.target.value })}
          />
          <TextField
            label="Value"
            type="number"
            fullWidth
            margin="dense"
            value={editingPerformance?.value || ''}
            onChange={(e) => setEditingPerformance({ ...editingPerformance, value: parseFloat(e.target.value) || 0 })}
          />
          <TextField
            label="Year Completed"
            type="number"
            fullWidth
            margin="dense"
            value={editingPerformance?.yearCompleted || ''}
            onChange={(e) => setEditingPerformance({ ...editingPerformance, yearCompleted: parseInt(e.target.value) || 0 })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            margin="dense"
            value={editingPerformance?.description || ''}
            onChange={(e) => setEditingPerformance({ ...editingPerformance, description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editingPerformance?.isReference || false}
                onChange={(e) => setEditingPerformance({ ...editingPerformance, isReference: e.target.checked })}
              />
            }
            label="Is this a reference?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerformanceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePerformance}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Section Dialog ──────────────────────────────────────── */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSection?._id ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Section Name *"
            fullWidth
            margin="dense"
            value={editingSection?.name || ''}
            onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            margin="dense"
            value={editingSection?.description || ''}
            onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
          />
          <TextField
            label="Page Number"
            type="number"
            fullWidth
            margin="dense"
            value={editingSection?.pageNumber || ''}
            onChange={(e) => setEditingSection({ ...editingSection, pageNumber: parseInt(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSection}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TenderForm;