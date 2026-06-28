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
    image: '',        // added
    status: 'draft',
    notes: '',
  });
  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

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

  // ─── Custom Print ──────────────────────────────────────────────────
  const handlePrint = () => {
    // ... (keep existing print logic; optionally include image)
    // For brevity, keep existing handlePrint – it already works
    // You can optionally add the image to the print by adding a <img> tag.
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
          {/* ... (keep existing fields) ... */}
        </Paper>

        {/* ─── Rest of the form ... ───────────────────────────────────*/}
        {/* ... (all existing fields) ... */}
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

      {/* ─── Existing Dialogs (personnel, performance, section) ── */}
      {/* ... (keep existing dialogs) ... */}
    </Paper>
  );
};

export default TenderForm;