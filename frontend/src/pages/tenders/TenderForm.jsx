import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Table, TableHead,
  TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, FormControlLabel, Checkbox,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const TenderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);
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
    status: 'draft',
    notes: '',
  });
  const [creator, setCreator] = useState(null);

  // ─── Dialogs ──────────────────────────────────────────────
  const [personnelDialog, setPersonnelDialog] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [performanceDialog, setPerformanceDialog] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const canEdit = ['admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'].includes(user?.role);
  const isReadOnly = form.status === 'submitted' || form.status === 'awarded' || !canEdit;

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
            volumeII: data.volumeII || {
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
            documents: data.documents || [],
            status: data.status || 'draft',
            notes: data.notes || '',
          });
          setCreator(data.createdBy);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load tender' });
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

  // ─── Submit ──────────────────────────────────────────────────
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
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Print ──────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
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
        {/* ─── Basic Info ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                fullWidth
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Type"
                fullWidth
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
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
                label="Client"
                fullWidth
                value={form.client}
                onChange={e => setForm({ ...form, client: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Contact Person"
                fullWidth
                value={form.clientContact}
                onChange={e => setForm({ ...form, clientContact: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Address"
                fullWidth
                value={form.clientAddress}
                onChange={e => setForm({ ...form, clientAddress: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Email"
                fullWidth
                type="email"
                value={form.clientEmail}
                onChange={e => setForm({ ...form, clientEmail: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Phone"
                fullWidth
                value={form.clientPhone}
                onChange={e => setForm({ ...form, clientPhone: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Reference Number"
                fullWidth
                value={form.referenceNumber}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Solicitation Number"
                fullWidth
                value={form.solicitationNumber}
                onChange={e => setForm({ ...form, solicitationNumber: e.target.value })}
                disabled={isReadOnly}
                placeholder="e.g., 19ZA6025PR15540238"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Project Name"
                fullWidth
                value={form.projectName}
                onChange={e => setForm({ ...form, projectName: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Location"
                fullWidth
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Issue Date"
                type="date"
                fullWidth
                value={form.issueDate}
                onChange={e => setForm({ ...form, issueDate: e.target.value })}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Site Visit Date"
                type="date"
                fullWidth
                value={form.siteVisitDate}
                onChange={e => setForm({ ...form, siteVisitDate: e.target.value })}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Award Date"
                type="date"
                fullWidth
                value={form.awardDate}
                onChange={e => setForm({ ...form, awardDate: e.target.value })}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── US Embassy / SF 1442 Specific ────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>US Embassy / SF 1442 Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isSF1442}
                    onChange={e => setForm({ ...form, isSF1442: e.target.checked })}
                    disabled={isReadOnly}
                  />
                }
                label="This is an SF 1442 Solicitation"
              />
            </Grid>
            {form.isSF1442 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contracting Office"
                    fullWidth
                    value={form.contractingOffice}
                    onChange={e => setForm({ ...form, contractingOffice: e.target.value })}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Facility Code"
                    fullWidth
                    value={form.facilityCode}
                    onChange={e => setForm({ ...form, facilityCode: e.target.value })}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.isBondRequired}
                        onChange={e => setForm({ ...form, isBondRequired: e.target.checked })}
                        disabled={isReadOnly}
                      />
                    }
                    label="Bond Required"
                  />
                </Grid>
                {form.isBondRequired && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Bond Days"
                      type="number"
                      fullWidth
                      value={form.bondDays}
                      onChange={e => setForm({ ...form, bondDays: parseInt(e.target.value) || 10 })}
                      disabled={isReadOnly}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Acceptance Days"
                    type="number"
                    fullWidth
                    value={form.acceptanceDays}
                    onChange={e => setForm({ ...form, acceptanceDays: parseInt(e.target.value) || 30 })}
                    disabled={isReadOnly}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* ─── Sections & Items ───────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sections & Scope of Work</Typography>
            {!isReadOnly && (
              <Button startIcon={<AddIcon />} variant="outlined" onClick={addSection}>
                Add Section
              </Button>
            )}
          </Box>
          {form.sections.map((section, secIdx) => (
            <Box key={secIdx} sx={{ mb: 4, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Section {secIdx + 1}: {section.name}
                  {section.pageNumber && <Chip label={`Page ${section.pageNumber}`} size="small" sx={{ ml: 1 }} />}
                </Typography>
                {!isReadOnly && (
                  <IconButton color="error" onClick={() => deleteSection(secIdx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>{section.description}</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {section.items.map((item, itemIdx) => (
                    <TableRow key={itemIdx}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.itemNumber || ''}
                          onChange={e => updateSectionItem(secIdx, itemIdx, 'itemNumber', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="#"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.description}
                          onChange={e => updateSectionItem(secIdx, itemIdx, 'description', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={e => updateSectionItem(secIdx, itemIdx, 'quantity', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.unit || 'Lot'}
                          onChange={e => updateSectionItem(secIdx, itemIdx, 'unit', e.target.value)}
                          disabled={isReadOnly}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateSectionItem(secIdx, itemIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {!isReadOnly && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItemFromSection(secIdx, itemIdx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isReadOnly && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="outlined"
                  onClick={() => addItemToSection(secIdx)}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
              )}
            </Box>
          ))}
          {form.sections.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No sections yet. Click "Add Section" to start building your scope of work.
            </Typography>
          )}
        </Paper>

        {/* ─── Price Proposal ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Price Proposal</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                label="Subtotal"
                type="number"
                fullWidth
                value={subtotal}
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Adjustment %"
                type="number"
                fullWidth
                value={form.priceProposal.percentageAdjustment || 0}
                onChange={e => setForm({
                  ...form,
                  priceProposal: { ...form.priceProposal, percentageAdjustment: parseFloat(e.target.value) || 0 }
                })}
                disabled={isReadOnly}
                InputProps={{ inputProps: { step: 0.1 } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Contingencies %"
                type="number"
                fullWidth
                value={form.priceProposal.contingencies || 0}
                onChange={e => setForm({
                  ...form,
                  priceProposal: { ...form.priceProposal, contingencies: parseFloat(e.target.value) || 0 }
                })}
                disabled={isReadOnly}
                InputProps={{ inputProps: { step: 0.1 } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="VAT %"
                type="number"
                fullWidth
                value={form.priceProposal.vat || 0}
                onChange={e => setForm({
                  ...form,
                  priceProposal: { ...form.priceProposal, vat: parseFloat(e.target.value) || 0 }
                })}
                disabled={isReadOnly}
                InputProps={{ inputProps: { step: 0.1 } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Currency"
                select
                fullWidth
                value={form.priceProposal.currency || 'ZMW'}
                onChange={e => setForm({
                  ...form,
                  priceProposal: { ...form.priceProposal, currency: e.target.value }
                })}
                disabled={isReadOnly}
              >
                <MenuItem value="ZMW">ZMW</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Exchange Rate"
                type="number"
                fullWidth
                value={form.priceProposal.exchangeRate || 1}
                onChange={e => setForm({
                  ...form,
                  priceProposal: { ...form.priceProposal, exchangeRate: parseFloat(e.target.value) || 1 }
                })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ textAlign: 'right' }}>
                Grand Total: <strong>{new Intl.NumberFormat('en-ZM', { style: 'currency', currency: form.priceProposal.currency || 'ZMW' }).format(grandTotal)}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Volume I: Price Proposal Details ───────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Volume I: Price Proposal</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.volumeI.sf1442Received}
                    onChange={e => setForm({
                      ...form,
                      volumeI: { ...form.volumeI, sf1442Received: e.target.checked }
                    })}
                    disabled={isReadOnly}
                  />
                }
                label="Signed SF 1442 Received"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price Breakdown"
                multiline
                rows={2}
                fullWidth
                value={form.volumeI.priceBreakdown}
                onChange={e => setForm({
                  ...form,
                  volumeI: { ...form.volumeI, priceBreakdown: e.target.value }
                })}
                disabled={isReadOnly}
                placeholder="Block down of Proposal Price by Division of Specifications"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Volume II: Business / Technical Proposal ──────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Volume II: Business / Technical Proposal</Typography>

          {/* Performance Schedule */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>1. Performance Schedule</Typography>
            <TextField
              label="Gantt Chart / Schedule"
              multiline
              rows={2}
              fullWidth
              value={form.volumeII.performanceSchedule}
              onChange={e => setForm({
                ...form,
                volumeII: { ...form.volumeII, performanceSchedule: e.target.value }
              })}
              disabled={isReadOnly}
              placeholder="Provide Gantt chart or performance schedule..."
            />
          </Box>

          {/* Key Personnel */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>2. Key Personnel</Typography>
              {!isReadOnly && (
                <Button startIcon={<PersonAddIcon />} size="small" variant="outlined" onClick={addPersonnel}>
                  Add Personnel
                </Button>
              )}
            </Box>
            {form.volumeII.keyPersonnel.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>No personnel added.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Qualifications</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Years with Firm</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.volumeII.keyPersonnel.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell>{p.qualifications}</TableCell>
                      <TableCell>{p.experience}</TableCell>
                      <TableCell>{p.yearsWithFirm}</TableCell>
                      <TableCell>
                        {!isReadOnly && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deletePersonnel(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          {/* Management Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>3. Management Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Bidder Information Sheet"
                  multiline
                  rows={1}
                  fullWidth
                  value={form.volumeII.managementInformation.bidderInfo}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        bidderInfo: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="SAM Registration / Unique ID"
                  fullWidth
                  value={form.volumeII.managementInformation.samRegistration}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        samRegistration: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Certifications / Orbin Insurance"
                  fullWidth
                  value={form.volumeII.managementInformation.certifications}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        certifications: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Litigation Status"
                  fullWidth
                  value={form.volumeII.managementInformation.litigationStatus}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        litigationStatus: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Political Affiliation Statement"
                  fullWidth
                  value={form.volumeII.managementInformation.politicalAffiliation}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        politicalAffiliation: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Equipment & Tools Schedule"
                  multiline
                  rows={2}
                  fullWidth
                  value={form.volumeII.managementInformation.equipmentSchedule}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        equipmentSchedule: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Company Profile"
                  multiline
                  rows={3}
                  fullWidth
                  value={form.volumeII.managementInformation.companyProfile}
                  onChange={e => setForm({
                    ...form,
                    volumeII: {
                      ...form.volumeII,
                      managementInformation: {
                        ...form.volumeII.managementInformation,
                        companyProfile: e.target.value
                      }
                    }
                  })}
                  disabled={isReadOnly}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Financial Capability */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>4. Financial Capability</Typography>
            <TextField
              label="Six (6) Bank Statements (list file names or references)"
              multiline
              rows={2}
              fullWidth
              value={form.volumeII.financialCapability.bankStatements.join(', ')}
              onChange={e => setForm({
                ...form,
                volumeII: {
                  ...form.volumeII,
                  financialCapability: {
                    ...form.volumeII.financialCapability,
                    bankStatements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }
                }
              })}
              disabled={isReadOnly}
              placeholder="e.g., Bank Statement Jan 2025, Bank Statement Feb 2025, ..."
            />
          </Box>

          {/* Past Performance */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>5. Past Performance</Typography>
              {!isReadOnly && (
                <Button startIcon={<WorkIcon />} size="small" variant="outlined" onClick={addPerformance}>
                  Add Project
                </Button>
              )}
            </Box>
            {form.volumeII.pastPerformance.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>No past performance records.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.volumeII.pastPerformance.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.projectName}</TableCell>
                      <TableCell>{p.client}</TableCell>
                      <TableCell>{p.value}</TableCell>
                      <TableCell>{p.yearCompleted}</TableCell>
                      <TableCell>{p.isReference ? '✓' : ''}</TableCell>
                      <TableCell>
                        {!isReadOnly && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deletePerformance(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          {/* Preliminary Safety Plan */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>6. Preliminary Safety Plan</Typography>
            <TextField
              label="Preliminary Safety Plan"
              multiline
              rows={4}
              fullWidth
              value={form.volumeII.preliminarySafetyPlan}
              onChange={e => setForm({
                ...form,
                volumeII: { ...form.volumeII, preliminarySafetyPlan: e.target.value }
              })}
              disabled={isReadOnly}
              placeholder="Provide a preliminary safety plan for the project..."
            />
          </Box>
        </Paper>

        {/* ─── Additional Fields ──────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Additional Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Notes / Comments"
                multiline
                rows={3}
                fullWidth
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description / Overview"
                multiline
                rows={3}
                fullWidth
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Status Display ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
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
            <Grid item xs={12} md={6}>
              <TextField
                label="Award Amount (if awarded)"
                type="number"
                fullWidth
                value={form.awardAmount || ''}
                onChange={e => setForm({ ...form, awardAmount: parseFloat(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        </Paper>
      </form>

      {/* ─── Dialogs ────────────────────────────────────────────── */}

      {/* Section Dialog */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSection?._id ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Section Name"
            fullWidth
            margin="dense"
            value={editingSection?.name || ''}
            onChange={e => setEditingSection({ ...editingSection, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            rows={2}
            value={editingSection?.description || ''}
            onChange={e => setEditingSection({ ...editingSection, description: e.target.value })}
          />
          <TextField
            label="Page Number"
            type="number"
            fullWidth
            margin="dense"
            value={editingSection?.pageNumber || ''}
            onChange={e => setEditingSection({ ...editingSection, pageNumber: parseInt(e.target.value) || 1 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSection}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Personnel Dialog */}
      <Dialog open={personnelDialog} onClose={() => setPersonnelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPersonnel?._id ? 'Edit Personnel' : 'Add Key Personnel'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="dense"
            value={editingPersonnel?.name || ''}
            onChange={e => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })}
          />
          <TextField
            label="Role"
            fullWidth
            margin="dense"
            value={editingPersonnel?.role || ''}
            onChange={e => setEditingPersonnel({ ...editingPersonnel, role: e.target.value })}
          />
          <TextField
            label="Qualifications"
            fullWidth
            margin="dense"
            value={editingPersonnel?.qualifications || ''}
            onChange={e => setEditingPersonnel({ ...editingPersonnel, qualifications: e.target.value })}
          />
          <TextField
            label="Experience"
            fullWidth
            margin="dense"
            value={editingPersonnel?.experience || ''}
            onChange={e => setEditingPersonnel({ ...editingPersonnel, experience: e.target.value })}
          />
          <TextField
            label="Years with Firm"
            type="number"
            fullWidth
            margin="dense"
            value={editingPersonnel?.yearsWithFirm || 0}
            onChange={e => setEditingPersonnel({ ...editingPersonnel, yearsWithFirm: parseInt(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPersonnelDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePersonnel}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Past Performance Dialog */}
      <Dialog open={performanceDialog} onClose={() => setPerformanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPerformance?._id ? 'Edit Performance' : 'Add Past Performance'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name"
            fullWidth
            margin="dense"
            value={editingPerformance?.projectName || ''}
            onChange={e => setEditingPerformance({ ...editingPerformance, projectName: e.target.value })}
          />
          <TextField
            label="Client"
            fullWidth
            margin="dense"
            value={editingPerformance?.client || ''}
            onChange={e => setEditingPerformance({ ...editingPerformance, client: e.target.value })}
          />
          <TextField
            label="Value"
            type="number"
            fullWidth
            margin="dense"
            value={editingPerformance?.value || ''}
            onChange={e => setEditingPerformance({ ...editingPerformance, value: parseFloat(e.target.value) || 0 })}
          />
          <TextField
            label="Year Completed"
            type="number"
            fullWidth
            margin="dense"
            value={editingPerformance?.yearCompleted || ''}
            onChange={e => setEditingPerformance({ ...editingPerformance, yearCompleted: parseInt(e.target.value) || new Date().getFullYear() })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            rows={2}
            value={editingPerformance?.description || ''}
            onChange={e => setEditingPerformance({ ...editingPerformance, description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editingPerformance?.isReference || false}
                onChange={e => setEditingPerformance({ ...editingPerformance, isReference: e.target.checked })}
              />
            }
            label="Can be used as reference"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerformanceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePerformance}>Save</Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default TenderForm;