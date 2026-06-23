import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, Chip, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, ListItemSecondaryAction,
  Tab, Tabs, FormControl, InputLabel, Select
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import DrawingCanvas from '../../components/DrawingCanvas';

const LAYER_TYPES = [
  { key: 'survey', label: 'Survey', icon: '🌐' },
  { key: 'boundary', label: 'Boundary', icon: '📍' },
  { key: 'road', label: 'Road', icon: '🛣️' },
  { key: 'building', label: 'Building', icon: '🏢' },
  { key: 'fence', label: 'Fence', icon: '🔲' },
  { key: 'drainage', label: 'Drainage', icon: '💧' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'water', label: 'Water', icon: '🚰' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'annotation', label: 'Annotation', icon: '✏️' },
];

const APP_STEPS = ['draft', 'submitted', 'survey_review', 'engineering_review', 'qs_review', 'director_approval', 'issued', 'as_built'];

const SitePlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);

  // ─── Form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    project: '',
    type: 'site_plan',
    status: 'draft',
    revision: 1,
    designer: '',
    checker: '',
    approver: '',
    issueDate: new Date().toISOString().split('T')[0],
    drawingNumber: '',
    surveyNumber: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyor: '',
    equipmentUsed: [],
    coordinateSystem: 'UTM',
    datum: 'WGS84',
    coordinates: [],
    area: 0,
    perimeter: 0,
    fenceLength: 0,
    posts: 0,
    concreteVolume: 0,
    chainLinkQty: 0,
    razorWireQty: 0,
    roadLength: 0,
    subgradeVol: 0,
    subbaseVol: 0,
    baseCourseVol: 0,
    asphaltQty: 0,
    drawingData: '',
    drawingImage: '',
    layers: LAYER_TYPES.map(l => ({ ...l, visible: true, locked: false })),
  });

  const [coords, setCoords] = useState([]);
  const [newCoord, setNewCoord] = useState({ northing: '', easting: '', elevation: '' });
  const [activeTab, setActiveTab] = useState(0);
  const [approvalStep, setApprovalStep] = useState(0);
  const [importDialog, setImportDialog] = useState(false);

  // ─── NEW: refs and scale for drawing canvas ──────────────────────
  const drawingCanvasRef = useRef(null);
  const [drawingScale, setDrawingScale] = useState(100);

  // ─── NEW: calculate area from canvas ──────────────────────────────
  const calculateAreaFromCanvas = () => {
    const polyData = drawingCanvasRef.current?.getPolygonData();
    if (polyData && polyData.points.length >= 3) {
      const factor = 0.01 * (100 / drawingScale);
      const areaM2 = polyData.area * factor * factor;
      const perimeterM = polyData.perimeter * factor;
      setForm(prev => ({ ...prev, area: areaM2, perimeter: perimeterM }));
      setMessage({ type: 'success', text: `Area: ${areaM2.toFixed(2)} m², Perimeter: ${perimeterM.toFixed(2)} m` });
    } else {
      setMessage({ type: 'warning', text: 'No polygon found on canvas. Draw a polygon or rectangle first.' });
    }
  };

  // ─── Fetch projects & users ─────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/users'),
        ]);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
        if (id) {
          const planRes = await api.get(`/api/site-plans/${id}`);
          const data = planRes.data;
          setForm(prev => ({
            ...prev,
            ...data,
            layers: data.layers || LAYER_TYPES.map(l => ({ ...l, visible: true, locked: false })),
          }));
          setCoords(data.coordinates || []);
          if (data.status) {
            const idx = APP_STEPS.indexOf(data.status);
            if (idx !== -1) setApprovalStep(idx);
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id]);

  // ─── Submit form ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = { ...form, coordinates: coords };
      if (id) {
        await api.put(`/api/site-plans/${id}`, payload);
        setMessage({ type: 'success', text: 'Plan updated!' });
      } else {
        await api.post('/api/site-plans', payload);
        setMessage({ type: 'success', text: 'Plan created!' });
      }
      setTimeout(() => navigate('/site-plans'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEquipmentToggle = (equip) => {
    const current = form.equipmentUsed || [];
    if (current.includes(equip)) {
      setForm({ ...form, equipmentUsed: current.filter(e => e !== equip) });
    } else {
      setForm({ ...form, equipmentUsed: [...current, equip] });
    }
  };

  // ─── Layer controls ──────────────────────────────────────────────────
  const toggleLayerVisibility = (key) => {
    setForm(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.key === key ? { ...l, visible: !l.visible } : l),
    }));
  };

  const toggleLayerLock = (key) => {
    setForm(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.key === key ? { ...l, locked: !l.locked } : l),
    }));
  };

  // ─── Coordinate handlers ─────────────────────────────────────────────
  const addCoordinate = () => {
    const { northing, easting, elevation } = newCoord;
    if (!northing || !easting) {
      alert('Northing and Easting are required.');
      return;
    }
    setCoords([...coords, { northing: parseFloat(northing), easting: parseFloat(easting), elevation: parseFloat(elevation || 0) }]);
    setNewCoord({ northing: '', easting: '', elevation: '' });
  };

  const removeCoordinate = (index) => {
    setCoords(coords.filter((_, i) => i !== index));
  };

  const clearCoordinates = () => {
    setCoords([]);
  };

  // ─── Submit for approval ────────────────────────────────────────────
  const submitForApproval = () => {
    const nextStep = approvalStep + 1;
    if (nextStep < APP_STEPS.length) {
      setApprovalStep(nextStep);
      setForm(prev => ({ ...prev, status: APP_STEPS[nextStep] }));
      setMessage({ type: 'success', text: `Advanced to ${APP_STEPS[nextStep].replace('_', ' ')}` });
    } else {
      alert('Already at final step.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Plan / Drawing' : 'New Plan / Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="General" />
          <Tab label="Drawing" />
          <Tab label="Survey Data" />
          <Tab label="Layers" />
          <Tab label="Approval" />
        </Tabs>

        {/* ─── Tab 0: General ────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {/* ... your existing fields ... */}
            {/* Add scale input */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Drawing Scale (1:)"
                type="number"
                fullWidth
                value={drawingScale}
                onChange={(e) => setDrawingScale(parseInt(e.target.value) || 100)}
              />
            </Grid>
            {/* ... rest of general fields ... */}
          </Grid>
        )}

        {/* ─── Tab 1: Drawing ────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Box>
            <DrawingCanvas
              ref={drawingCanvasRef}
              initialData={form.drawingData ? JSON.parse(form.drawingData) : null}
              onChange={(json) => {
                setForm(prev => ({ ...prev, drawingData: JSON.stringify(json) }));
              }}
              height={600}
              width={900}
              scale={drawingScale}
            />
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {form.area > 0 && <Chip label={`Area: ${form.area.toFixed(2)} m²`} color="primary" />}
              {form.perimeter > 0 && <Chip label={`Perimeter: ${form.perimeter.toFixed(2)} m`} color="primary" />}
              {form.fenceLength > 0 && <Chip label={`Fence: ${form.fenceLength}m, Posts: ${form.posts}`} color="secondary" />}
              {form.concreteVolume > 0 && <Chip label={`Concrete: ${form.concreteVolume.toFixed(2)} m³`} color="secondary" />}
              {form.roadLength > 0 && <Chip label={`Road: ${form.roadLength}m, Asphalt: ${form.asphaltQty.toFixed(2)} m³`} color="info" />}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => setMessage({ type: 'success', text: 'Drawing saved to plan!' })} startIcon={<SaveIcon />}>Save Canvas</Button>
              <Button variant="outlined" onClick={calculateAreaFromCanvas} startIcon={<SaveIcon />}>Calc Area from Canvas</Button>
              <Button variant="outlined" onClick={() => alert('Export PDF')}>Export PDF</Button>
              <Button variant="outlined" onClick={() => alert('Generate BOQ')}>Generate BOQ</Button>
            </Box>
          </Box>
        )}

        {/* ─── Tab 2: Survey Data ────────────────────────────────────────── */}
        {/* ... (unchanged) ... */}

        {/* ─── Tab 3: Layers ────────────────────────────────────────────── */}
        {/* ... (unchanged) ... */}

        {/* ─── Tab 4: Approval ───────────────────────────────────────────── */}
        {/* ... (unchanged) ... */}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Plan'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/site-plans')}>Cancel</Button>
        </Box>
      </form>

      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Drawing</DialogTitle>
        <DialogContent>
          <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center' }}>
            <UploadFileIcon fontSize="large" />
            <Typography>Drag & drop a file, or click to select</Typography>
            <Typography variant="caption">Supports: DWG, DXF, PDF, CSV (coordinates)</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SitePlanForm;
