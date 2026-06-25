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
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import DrawingCanvas from '../../components/DrawingCanvas';

// ─── Layer definitions ──────────────────────────────────────────────────
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

  // ─── Drawing canvas ref and scale ──────────────────────────────────
  const drawingCanvasRef = useRef(null);
  const [drawingScale, setDrawingScale] = useState(100);

  // ─── Calculate area from canvas ──────────────────────────────────
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
    if (!form.name) {
      setMessage({ type: 'error', text: 'Plan Name is required.' });
      return;
    }
    if (!form.project) {
      setMessage({ type: 'error', text: 'Project is required.' });
      return;
    }
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

  // ─── Custom print ────────────────────────────────────────────────────
  const handlePrint = () => {
    const fc = drawingCanvasRef.current?.getCanvas();
    let imageDataURL = null;
    if (fc) {
      imageDataURL = fc.toDataURL({ format: 'png', quality: 1 });
    }
    const printWindow = window.open('', '_blank');
    const projectName = projects.find(p => p._id === form.project)?.name || 'N/A';
    const designerName = users.find(u => u._id === form.designer)?.name || 'N/A';
    const checkerName = users.find(u => u._id === form.checker)?.name || 'N/A';
    const approverName = users.find(u => u._id === form.approver)?.name || 'N/A';

    printWindow.document.write(`
      <html>
        <head>
          <title>Site Plan - ${form.name}</title>
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
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; font-size: 11px; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .canvas-image { max-width: 100%; border: 1px solid #ccc; margin: 10px 0; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; }
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
              <span class="left">SITE PLAN</span>
              <span>${form.drawingNumber || form.name}</span>
            </div>
            <div class="info">
              <p><strong>Plan Name:</strong> ${form.name}</p>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Drawing Type:</strong> ${form.type}</p>
              <p><strong>Revision:</strong> ${form.revision}</p>
              <p><strong>Issue Date:</strong> ${form.issueDate || '—'}</p>
              <p><strong>Scale:</strong> 1:${drawingScale}</p>
              <p><strong>Designer:</strong> ${designerName}</p>
              <p><strong>Checker:</strong> ${checkerName}</p>
              <p><strong>Approver:</strong> ${approverName}</p>
              ${form.area > 0 ? `<p><strong>Area:</strong> ${form.area.toFixed(2)} m²</p>` : ''}
              ${form.perimeter > 0 ? `<p><strong>Perimeter:</strong> ${form.perimeter.toFixed(2)} m</p>` : ''}
              ${form.fenceLength > 0 ? `<p><strong>Fence Length:</strong> ${form.fenceLength} m</p>` : ''}
              ${form.posts > 0 ? `<p><strong>Posts:</strong> ${form.posts}</p>` : ''}
              ${form.concreteVolume > 0 ? `<p><strong>Concrete Volume:</strong> ${form.concreteVolume.toFixed(2)} m³</p>` : ''}
              ${form.roadLength > 0 ? `<p><strong>Road Length:</strong> ${form.roadLength} m</p>` : ''}
            </div>

            ${coords.length > 0 ? `
              <h4>Coordinates</h4>
              <table>
                <thead><tr><th>Point</th><th>Northing</th><th>Easting</th><th>Elevation</th></tr></thead>
                <tbody>
                  ${coords.map((c, i) => `<tr><td>${i+1}</td><td>${c.northing}</td><td>${c.easting}</td><td>${c.elevation || 0}</td></tr>`).join('')}
                </tbody>
              </table>
            ` : ''}

            ${imageDataURL ? `<img src="${imageDataURL}" class="canvas-image" alt="Site Plan Drawing" />` : ''}

            <div class="footer">PURVEYOLS CMS - Construction Management System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Plan / Drawing' : 'New Plan / Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* ─── Company Header – deep red ──────────────────────────── */}
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Plan Details</Typography>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print Plan</Button>
      </Box>

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
            <Grid item xs={12} sm={6}>
              <TextField label="Plan Name *" name="name" fullWidth value={form.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Project *"
                name="project"
                fullWidth
                value={form.project}
                onChange={handleChange}
                required
              >
                <MenuItem value="">Select Project</MenuItem>
                {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Drawing Type" name="type" fullWidth value={form.type} onChange={handleChange}>
                <MenuItem value="site_plan">Site Plan</MenuItem>
                <MenuItem value="building_plan">Building Plan</MenuItem>
                <MenuItem value="floor_plan">Floor Plan</MenuItem>
                <MenuItem value="foundation_plan">Foundation Plan</MenuItem>
                <MenuItem value="fence_plan">Fence Plan</MenuItem>
                <MenuItem value="road_design">Road Design</MenuItem>
                <MenuItem value="drainage">Drainage</MenuItem>
                <MenuItem value="water_reticulation">Water Reticulation</MenuItem>
                <MenuItem value="electrical">Electrical Layout</MenuItem>
                <MenuItem value="access_control">Access Control</MenuItem>
                <MenuItem value="fire_safety">Fire Safety</MenuItem>
                <MenuItem value="landscape">Landscape</MenuItem>
                <MenuItem value="topographic">Topographic</MenuItem>
                <MenuItem value="as_built">As-Built</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Revision Number" type="number" name="revision" fullWidth value={form.revision} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Designer" name="designer" fullWidth value={form.designer || ''} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Checker" name="checker" fullWidth value={form.checker || ''} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Approver" name="approver" fullWidth value={form.approver || ''} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Issue Date" type="date" name="issueDate" fullWidth value={form.issueDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Drawing Number" name="drawingNumber" fullWidth value={form.drawingNumber} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Drawing Scale (1:)"
                type="number"
                fullWidth
                value={drawingScale}
                onChange={(e) => setDrawingScale(parseInt(e.target.value) || 100)}
              />
            </Grid>
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
        {activeTab === 2 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Survey Number" name="surveyNumber" fullWidth value={form.surveyNumber} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Survey Date" type="date" name="surveyDate" fullWidth value={form.surveyDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Surveyor" name="surveyor" fullWidth value={form.surveyor || ''} onChange={handleChange}>
                  <MenuItem value="">Select</MenuItem>
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Equipment Used</InputLabel>
                  <Select
                    multiple
                    value={form.equipmentUsed || []}
                    onChange={(e) => setForm({ ...form, equipmentUsed: e.target.value })}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {['Total Station', 'RTK GPS', 'Drone', 'Automatic Level', 'Dumpy Level', 'Theodolite', 'Laser Level'].map(eq => (
                      <MenuItem key={eq} value={eq}>{eq}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Coordinate System" name="coordinateSystem" fullWidth value={form.coordinateSystem} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Datum" name="datum" fullWidth value={form.datum} onChange={handleChange} />
              </Grid>
            </Grid>

            {/* ─── Coordinate entry ──────────────────────────────────── */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Boundary Coordinates</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField label="Northing" type="number" fullWidth value={newCoord.northing} onChange={e => setNewCoord({ ...newCoord, northing: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Easting" type="number" fullWidth value={newCoord.easting} onChange={e => setNewCoord({ ...newCoord, easting: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Elevation (optional)" type="number" fullWidth value={newCoord.elevation} onChange={e => setNewCoord({ ...newCoord, elevation: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={addCoordinate} fullWidth>Add Point</Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                <List dense>
                  {coords.map((c, idx) => (
                    <ListItem key={idx} divider>
                      <ListItemText primary={`Point ${idx+1}`} secondary={`N: ${c.northing}, E: ${c.easting}, Z: ${c.elevation || 0}`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => removeCoordinate(idx)}>
                          <RemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {coords.length === 0 && <Typography variant="body2" color="textSecondary">No coordinates added yet.</Typography>}
                </List>
              </Box>
              <Button variant="outlined" color="error" onClick={clearCoordinates} sx={{ mt: 1 }} disabled={coords.length === 0}>Clear All</Button>
            </Box>
          </Box>
        )}

        {/* ─── Tab 3: Layers ────────────────────────────────────────────── */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Drawing Layers</Typography>
            <List>
              {form.layers && form.layers.map(layer => (
                <ListItem key={layer.key}>
                  <ListItemText primary={layer.label} secondary={layer.key} />
                  <ListItemSecondaryAction>
                    <Tooltip title={layer.visible ? 'Hide' : 'Show'}>
                      <IconButton onClick={() => toggleLayerVisibility(layer.key)}>
                        <span>{layer.visible ? '👁️' : '🙈'}</span>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={layer.locked ? 'Unlock' : 'Lock'}>
                      <IconButton onClick={() => toggleLayerLock(layer.key)}>
                        <span>{layer.locked ? '🔒' : '🔓'}</span>
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            {!form.layers && <Typography variant="body2" color="error">Layers not loaded. Please refresh.</Typography>}
          </Box>
        )}

        {/* ─── Tab 4: Approval ───────────────────────────────────────────── */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              {APP_STEPS.map((step, idx) => (
                <Chip
                  key={step}
                  label={step.replace('_', ' ')}
                  color={idx <= approvalStep ? 'success' : 'default'}
                  variant={idx === approvalStep ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={submitForApproval} disabled={approvalStep >= APP_STEPS.length-1}>
                Advance to Next Step
              </Button>
              <Button variant="outlined" onClick={() => setApprovalStep(0)}>Reset to Draft</Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>Current status: <strong>{APP_STEPS[approvalStep].replace('_', ' ')}</strong></Typography>
          </Box>
        )}

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