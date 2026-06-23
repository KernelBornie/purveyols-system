import React, { useState, useEffect } from 'react';
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
import DrawingCanvas from '../../components/DrawingCanvas'; // <-- new

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
            <Grid item xs={12} sm={6}>
              <TextField label="Plan Name *" name="name" fullWidth value={form.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Project *" name="project" fullWidth value={form.project} onChange={handleChange} required>
                <MenuItem value="">Select</MenuItem>
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
          </Grid>
        )}

        {/* ─── Tab 1: Drawing ────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Box>
            <DrawingCanvas
              initialData={form.drawingData ? JSON.parse(form.drawingData) : null}
              onChange={(json) => {
                setForm(prev => ({ ...prev, drawingData: JSON.stringify(json) }));
              }}
              height={600}
              width={900}
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
              <Button variant="outlined" onClick={() => alert('Export PDF')} startIcon={<SaveIcon />}>Export PDF</Button>
              <Button variant="outlined" onClick={() => alert('Generate BOQ')} startIcon={<SaveIcon />}>Generate BOQ</Button>
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
                  <Select multiple value={form.equipmentUsed || []} onChange={(e) => setForm({ ...form, equipmentUsed: e.target.value })} renderValue={(selected) => selected.join(', ')}>
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
