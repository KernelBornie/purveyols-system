import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Table, TableHead,
  TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, FormControlLabel, Checkbox,
  InputAdornment, Avatar, Accordion, AccordionSummary, AccordionDetails,
  Backdrop
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import html2pdf from 'html2pdf.js';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [docExpanded, setDocExpanded] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false); // loading indicator

  // ─── Form state with all fields ─────────────────────────────
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
    approvedBy: null,
    approvedAt: null,
    assignedStaff: [],
    assignedAt: null,
    verifiedBy: null,
    verifiedAt: null,
  });

  const [creator, setCreator] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [convertedToProject, setConvertedToProject] = useState(null);

  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit') || (!isViewMode && id);

  // ─── Dialogs ──────────────────────────────────────────────
  const [personnelDialog, setPersonnelDialog] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [performanceDialog, setPerformanceDialog] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const canDelete = DELETABLE_ROLES.includes(user?.role);
  const isReadOnly = isViewMode || form.status === 'submitted' || form.status === 'awarded' || form.status === 'verified' || !canEdit;

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

  // ─── Convert to Project ──────────────────────────────────────
  const handleConvertToProject = async () => {
    if (!window.confirm('Create a project from this awarded tender?')) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/tenders/${id}/convert-to-project`);
      setMessage({ type: 'success', text: `✅ Project "${res.data.project.name}" created!` });
      setConvertedToProject(res.data.project._id);
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to create project') });
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch tender data ──────────────────────────────────────
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
            approvedBy: data.approvedBy || null,
            approvedAt: data.approvedAt || null,
            assignedStaff: data.assignedStaff || [],
            assignedAt: data.assignedAt || null,
            verifiedBy: data.verifiedBy || null,
            verifiedAt: data.verifiedAt || null,
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

  // ─── Item handlers ────────────────────────────────────────────
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

  // ─── Build HTML content for print / PDF ──────────────────────
  const buildHTMLContent = () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
    };
    const photoHtml = imagePreview ? `<img src="${imagePreview}" style="max-width:200px; border:1px solid #ccc; margin:5px 0;" />` : '';
    const assignedNames = form.assignedStaff && form.assignedStaff.length > 0
      ? form.assignedStaff.map(s => `${s.name} (${s.role})`).join(', ')
      : '—';
    const { subtotal, grandTotal } = calculateGrandTotal();

    return `
      <div id="tender-pdf-content" style="font-family: 'Courier New', monospace; max-width: 1000px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c;">PURVEYOLS</h1>
          <div style="font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c;">Building and Civil contractors</div>
          <div style="font-size: 11px; margin: 1px 0;">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</div>
          <div style="font-size: 11px; margin: 1px 0;">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</div>
          <div style="font-size: 11px; margin: 1px 0;">Email: purveyols@gmail.com</div>
        </div>
        <div style="border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px;">
          <span style="font-weight: bold; font-size: 18px; letter-spacing: 2px; color: #b71c1c;">TENDER / RFQ</span>
        </div>
        <div style="margin-bottom: 10px;">
          ${photoHtml ? `<div style="margin:5px 0;">${photoHtml}</div>` : ''}
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
          ${form.approvedBy ? `<p><strong>Approved by:</strong> ${form.approvedBy.name} (${form.approvedBy.role}) at ${new Date(form.approvedAt).toLocaleString()}</p>` : ''}
          ${form.assignedStaff && form.assignedStaff.length > 0 ? `<p><strong>Assigned to:</strong> ${assignedNames} at ${new Date(form.assignedAt).toLocaleString()}</p>` : ''}
          ${form.verifiedBy ? `<p><strong>Verified by:</strong> ${form.verifiedBy.name} (${form.verifiedBy.role}) at ${new Date(form.verifiedAt).toLocaleString()}</p>` : ''}
        </div>
        ${form.sections && form.sections.length > 0 ? `
          <h3>Sections & Items</h3>
          ${form.sections.map((sec, idx) => `
            <h4>${sec.name}</h4>
            ${sec.description ? `<p>${sec.description}</p>` : ''}
            <table style="width:100%; border-collapse:collapse; margin:10px 0; font-size:11px;">
              <thead>
                <tr><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">#</th><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">Description</th><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">Qty</th><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">Unit</th><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">Unit Price</th><th style="border:1px solid #000; padding:4px; text-align:left; background:#f0f0f0;">Total</th></tr>
              </thead>
              <tbody>
                ${sec.items.map((item, i) => `
                  <tr>
                    <td style="border:1px solid #000; padding:4px;">${i+1}</td>
                    <td style="border:1px solid #000; padding:4px;">${item.description}</td>
                    <td style="border:1px solid #000; padding:4px;">${item.quantity}</td>
                    <td style="border:1px solid #000; padding:4px;">${item.unit}</td>
                    <td style="border:1px solid #000; padding:4px;">${formatCurrency(item.unitPrice)}</td>
                    <td style="border:1px solid #000; padding:4px;">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
          <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
          <p><strong>Grand Total:</strong> ${formatCurrency(grandTotal)}</p>
        ` : ''}
        <div style="margin-top:20px; border-top:1px solid #000; padding-top:10px;">
          <div style="display:flex; justify-content:space-between;">
            <div><strong>Approved by:</strong> ${form.approvedBy ? `${form.approvedBy.name} (${form.approvedBy.role})` : '_________________'}</div>
            <div><strong>Date:</strong> ${form.approvedAt ? new Date(form.approvedAt).toLocaleString() : '_________________'}</div>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <div><strong>Assigned to:</strong> ${assignedNames}</div>
            <div><strong>Date:</strong> ${form.assignedAt ? new Date(form.assignedAt).toLocaleString() : '_________________'}</div>
          </div>
        </div>
        <div style="text-align:center; font-size:10px; margin-top:20px; border-top:1px solid #000; padding-top:8px;">PURVEYOLS CMS - Construction Management System</div>
      </div>
    `;
  };

  // ─── Print handler ─────────────────────────────────────────────
  const handlePrint = () => {
    if (!form.title) {
      alert('No data to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Tender / RFQ</title><style>body { font-family: 'Courier New', monospace; }</style></head><body>${buildHTMLContent()}</body></html>`);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  // ─── PDF Download handler ──────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!form.title) {
      alert('No data to download.');
      return;
    }

    setPdfGenerating(true);

    // Build the HTML content
    const htmlContent = buildHTMLContent();

    // Create a temporary container that is visible but hidden behind the UI
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.maxWidth = '1000px';
    container.style.backgroundColor = '#fff';
    container.style.padding = '20px';
    container.style.zIndex = '-1000';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    // Generate PDF after a small delay to ensure rendering
    setTimeout(() => {
      const opt = {
        margin:       0.5,
        filename:     `Tender-${form.referenceNumber || 'document'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: true,
          windowWidth: 1000,
          windowHeight: container.scrollHeight + 100,
        },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(container).save()
        .then(() => {
          document.body.removeChild(container);
          setPdfGenerating(false);
        })
        .catch((err) => {
          console.error('PDF generation error:', err);
          document.body.removeChild(container);
          setPdfGenerating(false);
          alert('Failed to generate PDF. Please try again.');
        });
    }, 300);
  };

  const { subtotal, grandTotal } = calculateGrandTotal();

  if (fetching) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Backdrop open={pdfGenerating} sx={{ zIndex: 9999, color: '#fff' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>Generating PDF...</Typography>
        </Box>
      </Backdrop>

      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {id ? (isViewMode ? 'View Tender' : 'Edit Tender') : 'New Tender / RFQ'}
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            sx={{ mr: 1 }}
            disabled={pdfGenerating}
          >
            {pdfGenerating ? 'Generating...' : 'Download PDF'}
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

          {id && (form.status === 'awarded' || form.status === 'verified') && !convertedToProject && (
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

          {!isReadOnly && !isViewMode && (
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
      {isViewMode && (
        <Alert severity="info" sx={{ mb: 2 }}>You are viewing this tender in read‑only mode.</Alert>
      )}
      {isReadOnly && form.status === 'submitted' && (
        <Alert severity="info" sx={{ mb: 2 }}>This tender has been submitted. Edits are disabled.</Alert>
      )}
      {form.status === 'approved' && (
        <Alert severity="success" sx={{ mb: 2 }}>This tender has been approved!</Alert>
      )}
      {form.status === 'awarded' && (
        <Alert severity="success" sx={{ mb: 2 }}>This tender has been awarded!</Alert>
      )}
      {form.status === 'verified' && (
        <Alert severity="success" sx={{ mb: 2 }}>This tender has been verified!</Alert>
      )}

      <form>
        {/* ─── Uploaded Documents – PROMINENT DISPLAY ─────────────── */}
        {form.documents && form.documents.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, border: '2px solid #1976d2', backgroundColor: '#f5f9ff' }}>
            <Accordion expanded={docExpanded} onChange={() => setDocExpanded(!docExpanded)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  📄 Uploaded Document (Original Form)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {form.documents.map((doc, idx) => {
                  if (!doc || !doc.path) return null;
                  let mimeType = doc.mimeType || '';
                  if (!mimeType && doc.name) {
                    const ext = doc.name.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                      mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                    } else if (ext === 'pdf') {
                      mimeType = 'application/pdf';
                    }
                  }
                  mimeType = mimeType || '';
                  const isImage = mimeType.startsWith('image/');
                  const isPdf = mimeType === 'application/pdf';
                  const getFileUrl = (path) => {
                    if (path.startsWith('http')) return path;
                    if (api.defaults.baseURL) return `${api.defaults.baseURL}${path}`;
                    if (process.env.REACT_APP_API_URL) return `${process.env.REACT_APP_API_URL}${path}`;
                    return `${window.location.origin}${path}`;
                  };
                  const fullUrl = getFileUrl(doc.path);
                  return (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>{doc.name || 'Untitled'}</strong> ({mimeType || 'Unknown type'})
                      </Typography>
                      {isImage ? (
                        <Box sx={{ textAlign: 'center', bgcolor: '#fff', p: 1, border: '1px solid #ddd' }}>
                          <img src={fullUrl} alt={doc.name || 'Document'} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} onError={() => alert('Failed to load image.')} />
                        </Box>
                      ) : isPdf ? (
                        <Box sx={{ bgcolor: '#fff', p: 1, border: '1px solid #ddd' }}>
                          <iframe src={fullUrl} style={{ width: '100%', height: '80vh', minHeight: '500px' }} title={doc.name || 'PDF Document'} />
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 4, bgcolor: '#fff', border: '1px solid #ddd' }}>
                          <Typography variant="body1" color="textSecondary">Preview not available for this file type.</Typography>
                          <Button component="a" href={fullUrl} target="_blank" variant="contained" sx={{ mt: 2 }}>Download / View</Button>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}

        {/* ─── Image Upload ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Tender Image</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar src={imagePreview || '/tender-placeholder.jpg'} sx={{ width: 100, height: 100, borderRadius: 2, border: '1px solid #ccc', cursor: imagePreview ? 'pointer' : 'default' }} variant="rounded" onClick={handlePhotoClick} />
            {!isReadOnly && canEdit && !isViewMode && (
              <>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>
                <Button variant="outlined" component="label" startIcon={<CameraAltIcon />}>
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" hidden onChange={handleImageChange} />
                </Button>
                {imagePreview && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={removeImage}>Remove</Button>}
              </>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">JPEG, PNG, GIF, WEBP</Typography>
        </Paper>

        {/* ─── Basic Information ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Title *" fullWidth size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Solicitation Number" fullWidth size="small" value={form.solicitationNumber} onChange={(e) => setForm({ ...form, solicitationNumber: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Project Name" fullWidth size="small" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Location" fullWidth size="small" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Type" fullWidth size="small" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} disabled={isReadOnly}>
                <MenuItem value="solicitation">Solicitation</MenuItem>
                <MenuItem value="rfq">RFQ</MenuItem>
                <MenuItem value="tender">Tender</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem>
                <MenuItem value="bid">Bid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isReadOnly}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
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
              <TextField label="Client *" fullWidth size="small" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Client Address" fullWidth size="small" value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Client Email" fullWidth size="small" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Client Phone" fullWidth size="small" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Client Contact Person" fullWidth size="small" value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })} disabled={isReadOnly} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Dates ────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Important Dates</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField label="Issue Date" type="date" fullWidth size="small" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Due Date" type="date" fullWidth size="small" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Site Visit Date" type="date" fullWidth size="small" value={form.siteVisitDate} onChange={(e) => setForm({ ...form, siteVisitDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Award Date" type="date" fullWidth size="small" value={form.awardDate} onChange={(e) => setForm({ ...form, awardDate: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── SF1442 / US Embassy Specific ────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>SF 1442 / US Embassy Specific</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.isSF1442} onChange={(e) => setForm({ ...form, isSF1442: e.target.checked })} disabled={isReadOnly} />} label="Is this an SF 1442 (US Embassy) tender?" />
            </Grid>
            {form.isSF1442 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField label="Contracting Office" fullWidth size="small" value={form.contractingOffice} onChange={(e) => setForm({ ...form, contractingOffice: e.target.value })} disabled={isReadOnly} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Facility Code" fullWidth size="small" value={form.facilityCode} onChange={(e) => setForm({ ...form, facilityCode: e.target.value })} disabled={isReadOnly} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel control={<Checkbox checked={form.isBondRequired} onChange={(e) => setForm({ ...form, isBondRequired: e.target.checked })} disabled={isReadOnly} />} label="Bond Required?" />
                </Grid>
                {form.isBondRequired && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField label="Bond Days" type="number" fullWidth size="small" value={form.bondDays} onChange={(e) => setForm({ ...form, bondDays: parseInt(e.target.value) || 0 })} disabled={isReadOnly} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Acceptance Days" type="number" fullWidth size="small" value={form.acceptanceDays} onChange={(e) => setForm({ ...form, acceptanceDays: parseInt(e.target.value) || 0 })} disabled={isReadOnly} />
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
          <TextField label="Description" fullWidth multiline rows={4} size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isReadOnly} />
        </Paper>

        {/* ─── Sections & Items ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections & Items</Typography>
            {!isReadOnly && !isViewMode && <Button variant="outlined" startIcon={<AddIcon />} onClick={addSection}>Add Section</Button>}
          </Box>
          {form.sections.map((section, sectionIndex) => (
            <Paper key={section._id || sectionIndex} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1"><strong>{section.name}</strong></Typography>
                {!isReadOnly && !isViewMode && <IconButton size="small" color="error" onClick={() => deleteSection(sectionIndex)}><DeleteIcon /></IconButton>}
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
                      <TableCell><TextField size="small" fullWidth value={item.description} onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'description', e.target.value)} disabled={isReadOnly} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={item.quantity} onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'quantity', parseFloat(e.target.value) || 0)} disabled={isReadOnly} sx={{ width: 80 }} /></TableCell>
                      <TableCell><TextField size="small" value={item.unit} onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'unit', e.target.value)} disabled={isReadOnly} sx={{ width: 100 }} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={item.unitPrice} onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'unitPrice', parseFloat(e.target.value) || 0)} disabled={isReadOnly} sx={{ width: 120 }} /></TableCell>
                      <TableCell>{item.total?.toFixed(2)}</TableCell>
                      <TableCell>{!isReadOnly && !isViewMode && <IconButton size="small" color="error" onClick={() => removeItemFromSection(sectionIndex, itemIndex)}><DeleteIcon fontSize="small" /></IconButton>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isReadOnly && !isViewMode && <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addItemToSection(sectionIndex)} sx={{ mt: 1 }}>Add Item</Button>}
            </Paper>
          ))}
          {form.sections.length === 0 && <Typography variant="body2" color="textSecondary">No sections added yet.</Typography>}
        </Paper>

        {/* ─── Price Proposal ──────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Price Proposal</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField label="Subtotal" type="number" fullWidth size="small" value={subtotal} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Percentage Adjustment (%)" type="number" fullWidth size="small" value={form.priceProposal.percentageAdjustment} onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, percentageAdjustment: parseFloat(e.target.value) || 0 } })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Contingencies (%)" type="number" fullWidth size="small" value={form.priceProposal.contingencies} onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, contingencies: parseFloat(e.target.value) || 0 } })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="VAT (%)" type="number" fullWidth size="small" value={form.priceProposal.vat} onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, vat: parseFloat(e.target.value) || 0 } })} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Grand Total" type="number" fullWidth size="small" value={grandTotal} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Currency" fullWidth size="small" value={form.priceProposal.currency} onChange={(e) => setForm({ ...form, priceProposal: { ...form.priceProposal, currency: e.target.value } })} disabled={isReadOnly}>
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
            <FormControlLabel control={<Checkbox checked={form.volumeI.sf1442Received} onChange={(e) => setForm({ ...form, volumeI: { ...form.volumeI, sf1442Received: e.target.checked } })} disabled={isReadOnly} />} label="SF 1442 Received?" />
            <TextField label="Price Breakdown (Summary)" fullWidth multiline rows={3} size="small" value={form.volumeI.priceBreakdown} onChange={(e) => setForm({ ...form, volumeI: { ...form.volumeI, priceBreakdown: e.target.value } })} disabled={isReadOnly} sx={{ mt: 2 }} />
          </Paper>
        )}

        {/* ─── Volume II: Business/Technical ──────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Volume II: Business & Technical</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Performance Schedule" fullWidth multiline rows={2} size="small" value={form.volumeII.performanceSchedule} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, performanceSchedule: e.target.value } })} disabled={isReadOnly} />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Key Personnel ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Key Personnel</Typography>
            {!isReadOnly && !isViewMode && <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={addPersonnel}>Add Personnel</Button>}
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
                {!isReadOnly && !isViewMode && <IconButton size="small" color="error" onClick={() => deletePersonnel(idx)}><DeleteIcon /></IconButton>}
              </Box>
            </Paper>
          ))}
          {form.volumeII.keyPersonnel.length === 0 && <Typography variant="body2" color="textSecondary">No personnel added.</Typography>}
        </Paper>

        {/* ─── Management Information ──────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Management Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="Bidder Info" fullWidth size="small" value={form.volumeII.managementInformation.bidderInfo} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, bidderInfo: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12} md={6}><TextField label="SAM Registration" fullWidth size="small" value={form.volumeII.managementInformation.samRegistration} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, samRegistration: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Certifications" fullWidth size="small" value={form.volumeII.managementInformation.certifications} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, certifications: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Litigation Status" fullWidth size="small" value={form.volumeII.managementInformation.litigationStatus} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, litigationStatus: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Political Affiliation" fullWidth size="small" value={form.volumeII.managementInformation.politicalAffiliation} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, politicalAffiliation: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Equipment Schedule" fullWidth size="small" value={form.volumeII.managementInformation.equipmentSchedule} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, equipmentSchedule: e.target.value } } })} disabled={isReadOnly} /></Grid>
            <Grid item xs={12}><TextField label="Company Profile" fullWidth multiline rows={3} size="small" value={form.volumeII.managementInformation.companyProfile} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, managementInformation: { ...form.volumeII.managementInformation, companyProfile: e.target.value } } })} disabled={isReadOnly} /></Grid>
          </Grid>
        </Paper>

        {/* ─── Past Performance ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Past Performance</Typography>
            {!isReadOnly && !isViewMode && <Button variant="outlined" startIcon={<WorkIcon />} onClick={addPerformance}>Add Performance</Button>}
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
                {!isReadOnly && !isViewMode && <IconButton size="small" color="error" onClick={() => deletePerformance(idx)}><DeleteIcon /></IconButton>}
              </Box>
            </Paper>
          ))}
          {form.volumeII.pastPerformance.length === 0 && <Typography variant="body2" color="textSecondary">No past performance entries.</Typography>}
        </Paper>

        {/* ─── Preliminary Safety Plan ────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Preliminary Safety Plan</Typography>
          <TextField label="Safety Plan" fullWidth multiline rows={4} size="small" value={form.volumeII.preliminarySafetyPlan} onChange={(e) => setForm({ ...form, volumeII: { ...form.volumeII, preliminarySafetyPlan: e.target.value } })} disabled={isReadOnly} />
        </Paper>

        {/* ─── Notes ────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Notes</Typography>
          <TextField label="Notes" fullWidth multiline rows={3} size="small" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={isReadOnly} />
        </Paper>

        {/* ─── Actor Info Block ───────────────────────────────────── */}
        {id && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" display="block">Created by: {creator?.name} ({creator?.role}) at {new Date(createdAt).toLocaleString()}</Typography>
            {form.approvedBy && <Typography variant="caption" display="block">Approved by: {form.approvedBy.name} ({form.approvedBy.role}) at {new Date(form.approvedAt).toLocaleString()}</Typography>}
            {form.assignedStaff && form.assignedStaff.length > 0 && <Typography variant="caption" display="block">Assigned to: {form.assignedStaff.map(s => `${s.name} (${s.role})`).join(', ')} at {new Date(form.assignedAt).toLocaleString()}</Typography>}
            {form.verifiedBy && <Typography variant="caption" display="block">Verified by: {form.verifiedBy.name} ({form.verifiedBy.role}) at {new Date(form.verifiedAt).toLocaleString()}</Typography>}
          </Box>
        )}
      </form>

      {/* ─── Photo Preview Dialog ────────────────────────────────── */}
      <Dialog open={photoPreviewOpen} onClose={() => setPhotoPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Tender Image</span><IconButton onClick={() => setPhotoPreviewOpen(false)}><ZoomInIcon /></IconButton></DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>{imagePreview && <img src={imagePreview} alt="Tender" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />}</DialogContent>
        <DialogActions><Button onClick={() => setPhotoPreviewOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* ─── Personnel Dialog ────────────────────────────────────── */}
      <Dialog open={personnelDialog} onClose={() => setPersonnelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPersonnel?._id ? 'Edit Personnel' : 'Add Personnel'}</DialogTitle>
        <DialogContent>
          <TextField label="Name *" fullWidth margin="dense" value={editingPersonnel?.name || ''} onChange={(e) => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })} />
          <TextField label="Role *" fullWidth margin="dense" value={editingPersonnel?.role || ''} onChange={(e) => setEditingPersonnel({ ...editingPersonnel, role: e.target.value })} />
          <TextField label="Qualifications" fullWidth margin="dense" value={editingPersonnel?.qualifications || ''} onChange={(e) => setEditingPersonnel({ ...editingPersonnel, qualifications: e.target.value })} />
          <TextField label="Experience" fullWidth margin="dense" value={editingPersonnel?.experience || ''} onChange={(e) => setEditingPersonnel({ ...editingPersonnel, experience: e.target.value })} />
          <TextField label="Years with Firm" type="number" fullWidth margin="dense" value={editingPersonnel?.yearsWithFirm || 0} onChange={(e) => setEditingPersonnel({ ...editingPersonnel, yearsWithFirm: parseInt(e.target.value) || 0 })} />
        </DialogContent>
        <DialogActions><Button onClick={() => setPersonnelDialog(false)}>Cancel</Button><Button variant="contained" onClick={savePersonnel}>Save</Button></DialogActions>
      </Dialog>

      {/* ─── Performance Dialog ────────────────────────────────────── */}
      <Dialog open={performanceDialog} onClose={() => setPerformanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPerformance?._id ? 'Edit Performance' : 'Add Performance'}</DialogTitle>
        <DialogContent>
          <TextField label="Project Name *" fullWidth margin="dense" value={editingPerformance?.projectName || ''} onChange={(e) => setEditingPerformance({ ...editingPerformance, projectName: e.target.value })} />
          <TextField label="Client *" fullWidth margin="dense" value={editingPerformance?.client || ''} onChange={(e) => setEditingPerformance({ ...editingPerformance, client: e.target.value })} />
          <TextField label="Value" type="number" fullWidth margin="dense" value={editingPerformance?.value || ''} onChange={(e) => setEditingPerformance({ ...editingPerformance, value: parseFloat(e.target.value) || 0 })} />
          <TextField label="Year Completed" type="number" fullWidth margin="dense" value={editingPerformance?.yearCompleted || ''} onChange={(e) => setEditingPerformance({ ...editingPerformance, yearCompleted: parseInt(e.target.value) || 0 })} />
          <TextField label="Description" fullWidth multiline rows={2} margin="dense" value={editingPerformance?.description || ''} onChange={(e) => setEditingPerformance({ ...editingPerformance, description: e.target.value })} />
          <FormControlLabel control={<Checkbox checked={editingPerformance?.isReference || false} onChange={(e) => setEditingPerformance({ ...editingPerformance, isReference: e.target.checked })} />} label="Is this a reference?" />
        </DialogContent>
        <DialogActions><Button onClick={() => setPerformanceDialog(false)}>Cancel</Button><Button variant="contained" onClick={savePerformance}>Save</Button></DialogActions>
      </Dialog>

      {/* ─── Section Dialog ──────────────────────────────────────── */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSection?._id ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <TextField label="Section Name *" fullWidth margin="dense" value={editingSection?.name || ''} onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={2} margin="dense" value={editingSection?.description || ''} onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })} />
          <TextField label="Page Number" type="number" fullWidth margin="dense" value={editingSection?.pageNumber || ''} onChange={(e) => setEditingSection({ ...editingSection, pageNumber: parseInt(e.target.value) || 0 })} />
        </DialogContent>
        <DialogActions><Button onClick={() => setSectionDialog(false)}>Cancel</Button><Button variant="contained" onClick={saveSection}>Save</Button></DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TenderForm;