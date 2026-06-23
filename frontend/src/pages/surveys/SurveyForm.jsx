import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, Chip, IconButton, Tooltip, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import { useDropzone } from 'react-dropzone';
import DrawingCanvas from '../../components/DrawingCanvas';

const SurveyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const drawingCanvasRef = useRef(null);
  const [drawingScale, setDrawingScale] = useState(100);

  const [form, setForm] = useState({
    project: '',
    surveyNumber: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyor: '',
    equipmentUsed: [],
    boundaryCoordinates: [],
    contours: [],
    area: 0,
    perimeter: 0,
    fileUrls: [],
    status: 'draft',
    cutVolume: 0,
    fillVolume: 0,
    netVolume: 0,
    drawingData: '',
  });
  const [coords, setCoords] = useState([]);
  const [newCoord, setNewCoord] = useState({ northing: '', easting: '', elevation: '' });
  const [importDialog, setImportDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const equipmentOptions = ['Total Station', 'RTK GPS', 'Drone', 'Automatic Level', 'Dumpy Level', 'Theodolite', 'Laser Level'];
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      if (files.length) {
        setUploadedFile(files[0]);
        handleFileUpload(files[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
  });

  // ─── Fetch data ──────────────────────────────────────────────────────
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
          const surveyRes = await api.get(`/api/surveys/${id}`);
          const data = surveyRes.data;
          setForm(data);
          setCoords(data.boundaryCoordinates.map(c => ({ northing: c.northing, easting: c.easting, elevation: c.elevation || 0 })));
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id]);

  // ─── Coordinate handlers ──────────────────────────────────────────
  const addCoordinate = () => {
    const { northing, easting, elevation } = newCoord;
    if (!northing || !easting) {
      alert('Northing and Easting are required.');
      return;
    }
    const newPoint = {
      northing: parseFloat(northing),
      easting: parseFloat(easting),
      elevation: parseFloat(elevation || 0),
    };
    setCoords([...coords, newPoint]);
    setNewCoord({ northing: '', easting: '', elevation: '' });
  };

  const removeCoordinate = (index) => {
    setCoords(coords.filter((_, i) => i !== index));
  };

  const clearCoordinates = () => {
    setCoords([]);
  };

  // ─── File upload ──────────────────────────────────────────────────
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (file.name.endsWith('.csv')) {
        const lines = content.split('\n');
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const northing = parseFloat(parts[0]);
            const easting = parseFloat(parts[1]);
            if (!isNaN(northing) && !isNaN(easting)) {
              setCoords(prev => [...prev, { northing, easting, elevation: parseFloat(parts[2] || 0) }]);
            }
          }
        });
      }
      setImportDialog(false);
    };
    reader.readAsText(file);
  };

  // ─── Calculate area/perimeter (from canvas or coordinates) ──────
  const calculateAreaPerimeter = () => {
    const polyData = drawingCanvasRef.current?.getPolygonData();
    if (polyData && polyData.points.length >= 3) {
      const factor = 0.01 * (100 / drawingScale);
      const areaM2 = polyData.area * factor * factor;
      const perimeterM = polyData.perimeter * factor;
      setForm(prev => ({ ...prev, area: areaM2, perimeter: perimeterM }));
      setMessage({ type: 'success', text: `Area: ${areaM2.toFixed(2)} m², Perimeter: ${perimeterM.toFixed(2)} m` });
      return;
    }

    if (coords.length < 3) {
      setMessage({ type: 'warning', text: 'Need at least 3 coordinates or draw a polygon on canvas.' });
      return;
    }
    let area = 0;
    let perimeter = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i].northing * coords[j].easting;
      area -= coords[j].northing * coords[i].easting;
      const dx = coords[j].northing - coords[i].northing;
      const dy = coords[j].easting - coords[i].easting;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    area = Math.abs(area) / 2;
    const scale = 111320;
    area = area * scale * scale;
    perimeter = perimeter * scale;
    setForm(prev => ({ ...prev, area, perimeter }));
    setMessage({ type: 'success', text: `Area: ${area.toFixed(2)} m², Perimeter: ${perimeter.toFixed(2)} m` });
  };

  // ─── Compute cut/fill ─────────────────────────────────────────────
  const handleCalculateCutFill = async () => {
    if (!id) {
      alert('Please save the survey first, then compute cut/fill.');
      return;
    }
    try {
      const res = await api.post(`/api/surveys/${id}/calculate`);
      setForm(prev => ({
        ...prev,
        cutVolume: res.data.cutVolume,
        fillVolume: res.data.fillVolume,
        netVolume: res.data.netVolume,
      }));
      setMessage({ type: 'success', text: 'Cut/fill computed!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Calculation failed' });
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!form.surveyNumber) {
      setMessage({ type: 'error', text: 'Survey Number is required.' });
      return;
    }
    if (!form.project) {
      setMessage({ type: 'error', text: 'Project is required.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const payload = { ...form, boundaryCoordinates: coords };
      if (id) {
        await api.put(`/api/surveys/${id}`, payload);
        setMessage({ type: 'success', text: 'Survey updated!' });
      } else {
        await api.post('/api/surveys', payload);
        setMessage({ type: 'success', text: 'Survey created!' });
      }
      setTimeout(() => navigate('/surveys'), 1500);
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

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Survey' : 'New Survey'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="General" />
          <Tab label="Coordinates" />
          <Tab label="Drawing" />
        </Tabs>

        {/* ─── Tab 0: General ────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Survey Number *"
                name="surveyNumber"
                fullWidth
                value={form.surveyNumber}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Survey Date"
                name="surveyDate"
                type="date"
                fullWidth
                value={form.surveyDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
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
                {projects.map(p => (
                  <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Surveyor"
                name="surveyor"
                fullWidth
                value={form.surveyor || ''}
                onChange={handleChange}
              >
                <MenuItem value="">Select Surveyor</MenuItem>
                {users.map(u => (
                  <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Equipment Used</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {equipmentOptions.map(equip => (
                  <Chip
                    key={equip}
                    label={equip}
                    color={form.equipmentUsed?.includes(equip) ? 'primary' : 'default'}
                    onClick={() => handleEquipmentToggle(equip)}
                    variant={form.equipmentUsed?.includes(equip) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Status"
                name="status"
                select
                fullWidth
                value={form.status}
                onChange={handleChange}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
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

        {/* ─── Tab 1: Coordinates ───────────────────────────────────── */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Boundary Coordinates</Typography>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Northing"
                  type="number"
                  fullWidth
                  value={newCoord.northing}
                  onChange={e => setNewCoord({ ...newCoord, northing: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Easting"
                  type="number"
                  fullWidth
                  value={newCoord.easting}
                  onChange={e => setNewCoord({ ...newCoord, easting: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Elevation (optional)"
                  type="number"
                  fullWidth
                  value={newCoord.elevation}
                  onChange={e => setNewCoord({ ...newCoord, elevation: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addCoordinate} fullWidth>Add Point</Button>
              </Grid>
            </Grid>

            <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
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
                {coords.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ p: 1 }}>No coordinates added yet.</Typography>
                )}
              </List>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={clearCoordinates} disabled={coords.length === 0} color="error">
                Clear All
              </Button>
              <Button variant="outlined" onClick={calculateAreaPerimeter}>
                Calculate Area & Perimeter
              </Button>
              <Button variant="outlined" onClick={handleCalculateCutFill}>
                Compute Cut/Fill
              </Button>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportDialog(true)}>
                Import CSV
              </Button>
            </Box>

            {form.area > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Area: {form.area.toFixed(2)} m²</Typography>
                <Typography variant="body2">Perimeter: {form.perimeter.toFixed(2)} m</Typography>
              </Box>
            )}
            {form.cutVolume > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Cut Volume: {form.cutVolume.toFixed(2)} m³</Typography>
                <Typography variant="body2">Fill Volume: {form.fillVolume.toFixed(2)} m³</Typography>
                <Typography variant="body2">Net Volume: {form.netVolume.toFixed(2)} m³</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ─── Tab 2: Drawing ───────────────────────────────────────── */}
        {activeTab === 2 && (
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
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setMessage({ type: 'success', text: 'Drawing saved to survey!' })} startIcon={<SaveIcon />}>
                Save Drawing
              </Button>
              <Button variant="outlined" onClick={calculateAreaPerimeter} startIcon={<SaveIcon />}>
                Calc Area from Canvas
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Survey'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/surveys')}>Cancel</Button>
        </Box>
      </form>

      {/* ─── Import Dialog ──────────────────────────────────────────── */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Coordinates (CSV)</DialogTitle>
        <DialogContent>
          <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', cursor: 'pointer' }}>
            <input {...getInputProps()} />
            <UploadFileIcon fontSize="large" />
            <Typography>Drag & drop a CSV file, or click to select</Typography>
            <Typography variant="caption">Format: Northing, Easting, Elevation (optional)</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SurveyForm;
