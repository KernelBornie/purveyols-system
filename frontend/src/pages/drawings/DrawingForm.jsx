import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, ListItemSecondaryAction,
  Tab, Tabs, FormControl, InputLabel, Select
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import GridOnIcon from '@mui/icons-material/GridOn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import * as fabric from 'fabric';
import { useDropzone } from 'react-dropzone';

const LAYER_TYPES = [
  { key: 'survey', label: 'Survey', icon: '🌐' },
  { key: 'boundary', label: 'Boundary', icon: '📍' },
  { key: 'building', label: 'Building', icon: '🏢' },
  { key: 'fence', label: 'Fence', icon: '🔲' },
  { key: 'road', label: 'Road', icon: '🛣️' },
  { key: 'drainage', label: 'Drainage', icon: '💧' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'water', label: 'Water', icon: '🚰' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'annotation', label: 'Annotation', icon: '✏️' },
];

const APP_STEPS = ['draft', 'submitted', 'survey_review', 'engineering_review', 'qs_review', 'director_approval', 'issued', 'as_built'];

const DrawingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  const [canvas, setCanvas] = useState(null);

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
    createdDate: new Date().toISOString().split('T')[0],
    drawingNumber: '',
    scale: '1:100',
    units: 'm',
    coordinateSystem: 'UTM',
    drawingData: '',
    drawingImage: '',
    layers: LAYER_TYPES.map(l => ({ ...l, visible: true, locked: false })),
  });

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [approvalStep, setApprovalStep] = useState(0);
  const [importDialog, setImportDialog] = useState(false);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      if (files.length) {
        handleFileUpload(files[0]);
      }
    },
    accept: {
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
    },
  });

  // ─── Canvas setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 900,
      height: 600,
      backgroundColor: '#f5f5f5',
      selection: true,
    });
    if (showGrid) drawGrid(fabricCanvas);
    if (form.drawingData) {
      fabricCanvas.loadFromJSON(JSON.parse(form.drawingData), () => {
        fabricCanvas.renderAll();
        saveHistory(fabricCanvas);
      });
    } else {
      saveHistory(fabricCanvas);
    }
    fabricCanvas.on('object:added', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:modified', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:removed', () => saveHistory(fabricCanvas));
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

  // ─── Grid ──────────────────────────────────────────────────────────
  const drawGrid = (fabricCanvas) => {
    const gridSize = 20;
    const w = fabricCanvas.getWidth();
    const h = fabricCanvas.getHeight();
    const old = fabricCanvas.getObjects().filter(o => o.excludeFromExport);
    old.forEach(o => fabricCanvas.remove(o));
    for (let i = 0; i < w; i += gridSize) {
      fabricCanvas.add(new fabric.Line([i, 0, i, h], { stroke: '#ddd', strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true }));
    }
    for (let i = 0; i < h; i += gridSize) {
      fabricCanvas.add(new fabric.Line([0, i, w, i], { stroke: '#ddd', strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true }));
    }
    fabricCanvas.renderAll();
  };

  // ─── History ──────────────────────────────────────────────────────
  const saveHistory = (fabricCanvas) => {
    const json = fabricCanvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      canvas.loadFromJSON(history[newIndex], () => canvas.renderAll());
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      canvas.loadFromJSON(history[newIndex], () => canvas.renderAll());
    }
  };

  // ─── Tool handlers ──────────────────────────────────────────────
  const addShape = (type, props = {}) => {
    if (!canvas) return;
    let shape;
    const defaultProps = {
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      fill: 'rgba(0,123,255,0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
      selectable: true,
    };
    const merged = { ...defaultProps, ...props };
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...merged, width: 80, height: 60 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...merged, radius: 40 });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 200], { stroke: '#dc3545', strokeWidth: 3, selectable: true });
        break;
      case 'polygon':
        shape = new fabric.Polygon([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }], { ...merged, fill: 'rgba(40,167,69,0.3)', stroke: '#28a745' });
        break;
      case 'text':
        shape = new fabric.Textbox('Edit me', { left: 200, top: 200, fontSize: 20, fill: '#333', width: 200, selectable: true });
        break;
      default:
        return;
    }
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const enableFreehand = () => {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#000';
    canvas.freeDrawingBrush.width = 2;
    setSelectedTool('pencil');
  };

  const disableFreehand = () => {
    if (!canvas) return;
    canvas.isDrawingMode = false;
    setSelectedTool('select');
  };

  const handleDeleteSelected = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.renderAll();
      saveHistory(canvas);
    } else {
      alert('Select an object first.');
    }
  };

  const handleClearCanvas = () => {
    if (!canvas) return;
    if (window.confirm('Clear all drawing?')) {
      canvas.clear();
      canvas.backgroundColor = '#f5f5f5';
      if (showGrid) drawGrid(canvas);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  // ─── Specialised tools ──────────────────────────────────────────
  const addFenceLine = () => {
    if (!canvas) return;
    const line = new fabric.Line([50, 50, 300, 50], { stroke: '#8B4513', strokeWidth: 4, selectable: true });
    const posts = [];
    for (let i = 0; i < 6; i++) {
      const post = new fabric.Rect({ left: 50 + i * 50, top: 40, width: 6, height: 20, fill: '#8B4513', selectable: true });
      posts.push(post);
    }
    const group = new fabric.Group([line, ...posts], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };

  const addBuildingFootprint = () => addShape('rect', { fill: 'rgba(255,0,0,0.1)', stroke: '#dc3545' });
  const addRoadAlignment = () => addShape('line', { stroke: '#ff9800', strokeWidth: 6 });
  const addDrainage = () => {
    if (!canvas) return;
    const line = new fabric.Line([50, 150, 350, 150], { stroke: '#007bff', strokeWidth: 6, strokeDashArray: [8, 4], selectable: true });
    canvas.add(line);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addGate = () => addShape('rect', { fill: 'transparent', stroke: '#28a745', strokeWidth: 4, width: 40, height: 60 });
  const addCCTV = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({ left: 150, top: 150, radius: 12, fill: '#dc3545', stroke: '#fff', strokeWidth: 2, selectable: true });
    const text = new fabric.Text('CCTV', { left: 160, top: 140, fontSize: 12, fill: '#dc3545' });
    const group = new fabric.Group([circle, text], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addGuardHouse = () => addShape('rect', { fill: '#ffc107', stroke: '#333', strokeWidth: 2, width: 20, height: 30 });

  const measureDistance = () => alert('Click two points to measure distance (simulated).');

  // ─── Save drawing ──────────────────────────────────────────────────
  const saveDrawingToForm = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const dataUrl = canvas.toDataURL('image/png');
    setForm(prev => ({
      ...prev,
      drawingData: JSON.stringify(json),
      drawingImage: dataUrl,
    }));
    setMessage({ type: 'success', text: 'Drawing saved!' });
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
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
              const circle = new fabric.Circle({ left: x, top: y, radius: 4, fill: '#dc3545', selectable: true });
              canvas.add(circle);
            }
          }
        });
        canvas.renderAll();
        saveHistory(canvas);
      }
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const fabricImg = new fabric.Image(img, { left: 50, top: 50, scaleX: 0.5, scaleY: 0.5, selectable: true });
          canvas.add(fabricImg);
          canvas.renderAll();
          saveHistory(canvas);
        };
      }
      setImportDialog(false);
    };
    reader.readAsText(file);
  };

  const exportPDF = () => alert('PDF export would be generated here.');

  // ─── Fetch data ──────────────────────────────────────────────────
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
          const drawingRes = await api.get(`/api/drawings/${id}`);
          const data = drawingRes.data;
          setForm(data);
          if (data.drawingData && canvas) {
            canvas.loadFromJSON(JSON.parse(data.drawingData), () => {
              canvas.renderAll();
              saveHistory(canvas);
            });
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id, canvas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    saveDrawingToForm();
    setLoading(true);
    setMessage(null);
    try {
      if (id) {
        await api.put(`/api/drawings/${id}`, form);
        setMessage({ type: 'success', text: 'Drawing updated!' });
      } else {
        await api.post('/api/drawings', form);
        setMessage({ type: 'success', text: 'Drawing created!' });
      }
      setTimeout(() => navigate('/drawings'), 1500);
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

  // ─── Layer controls ──────────────────────────────────────────────
  const toggleLayerVisibility = (key) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const layerObjects = objects.filter(o => o.layer === key);
    const layer = form.layers.find(l => l.key === key);
    if (layer) {
      const newVisible = !layer.visible;
      layerObjects.forEach(o => o.visible = newVisible);
      setForm(prev => ({
        ...prev,
        layers: prev.layers.map(l => l.key === key ? { ...l, visible: newVisible } : l),
      }));
      canvas.renderAll();
    }
  };

  const toggleLayerLock = (key) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const layerObjects = objects.filter(o => o.layer === key);
    const layer = form.layers.find(l => l.key === key);
    if (layer) {
      const newLock = !layer.locked;
      layerObjects.forEach(o => o.selectable = !newLock);
      setForm(prev => ({
        ...prev,
        layers: prev.layers.map(l => l.key === key ? { ...l, locked: newLock } : l),
      }));
    }
  };

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

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Drawing' : 'New Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="General" />
          <Tab label="Drawing" />
          <Tab label="Layers" />
          <Tab label="Approval" />
        </Tabs>

        {/* ─── General ─────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Drawing Name *" name="name" fullWidth value={form.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Project *" name="project" fullWidth value={form.project} onChange={handleChange} required>
                <MenuItem value="">Select</MenuItem>
                {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Drawing Number" name="drawingNumber" fullWidth value={form.drawingNumber} onChange={handleChange} />
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
            <Grid item xs={12} sm={4}>
              <TextField label="Revision Number" type="number" name="revision" fullWidth value={form.revision} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Status" name="status" fullWidth value={form.status} onChange={handleChange}>
                {APP_STEPS.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Scale" name="scale" fullWidth value={form.scale} onChange={handleChange} />
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
              <TextField label="Created Date" type="date" name="createdDate" fullWidth value={form.createdDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Issue Date" type="date" name="issueDate" fullWidth value={form.issueDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Units" name="units" fullWidth value={form.units} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Coordinate System" name="coordinateSystem" fullWidth value={form.coordinateSystem} onChange={handleChange} />
            </Grid>
          </Grid>
        )}

        {/* ─── Drawing ─────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Tooltip title="Select"><Button variant={selectedTool === 'select' ? 'contained' : 'outlined'} size="small" onClick={() => { disableFreehand(); setSelectedTool('select'); }}>Select</Button></Tooltip>
              <Tooltip title="Move"><Button variant={selectedTool === 'move' ? 'contained' : 'outlined'} size="small" onClick={() => { disableFreehand(); setSelectedTool('move'); }}>Move</Button></Tooltip>
              <Tooltip title="Measure"><Button variant="outlined" size="small" onClick={measureDistance}>📏</Button></Tooltip>
              <Tooltip title="Dimension"><Button variant="outlined" size="small" onClick={() => addShape('text')}>📐</Button></Tooltip>
              <Tooltip title="Text"><Button variant="outlined" size="small" onClick={() => addShape('text')}>T</Button></Tooltip>
              <Tooltip title="Boundary"><Button variant="outlined" size="small" onClick={() => addShape('polygon')}>🔲</Button></Tooltip>
              <Tooltip title="Polygon"><Button variant="outlined" size="small" onClick={() => addShape('polygon')}>△</Button></Tooltip>
              <Tooltip title="Line"><Button variant="outlined" size="small" onClick={() => addShape('line')}>╱</Button></Tooltip>
              <Tooltip title="Circle"><Button variant="outlined" size="small" onClick={() => addShape('circle')}>◯</Button></Tooltip>
              <Tooltip title="Rectangle"><Button variant="outlined" size="small" onClick={() => addShape('rect')}>▭</Button></Tooltip>
              <Tooltip title="Freehand"><Button variant={selectedTool === 'pencil' ? 'contained' : 'outlined'} size="small" onClick={enableFreehand}>✏️</Button></Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Fence Line"><Button variant="outlined" size="small" onClick={addFenceLine}>🔲</Button></Tooltip>
              <Tooltip title="Building Footprint"><Button variant="outlined" size="small" onClick={addBuildingFootprint}>🏢</Button></Tooltip>
              <Tooltip title="Road Alignment"><Button variant="outlined" size="small" onClick={addRoadAlignment}>🛣️</Button></Tooltip>
              <Tooltip title="Drainage"><Button variant="outlined" size="small" onClick={addDrainage}>💧</Button></Tooltip>
              <Tooltip title="Gate"><Button variant="outlined" size="small" onClick={addGate}>🚪</Button></Tooltip>
              <Tooltip title="CCTV"><Button variant="outlined" size="small" onClick={addCCTV}>📷</Button></Tooltip>
              <Tooltip title="Guard House"><Button variant="outlined" size="small" onClick={addGuardHouse}>🏠</Button></Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Undo"><IconButton onClick={undo} disabled={historyIndex <= 0}><UndoIcon /></IconButton></Tooltip>
              <Tooltip title="Redo"><IconButton onClick={redo} disabled={historyIndex >= history.length-1}><RedoIcon /></IconButton></Tooltip>
              <Tooltip title="Delete selected"><IconButton color="error" onClick={handleDeleteSelected}><DeleteIcon /></IconButton></Tooltip>
              <Tooltip title="Clear all"><IconButton color="error" onClick={handleClearCanvas}><ClearIcon /></IconButton></Tooltip>
              <Tooltip title="Grid"><IconButton color={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid(!showGrid)}><GridOnIcon /></IconButton></Tooltip>
              <Tooltip title="Zoom In"><IconButton onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom()*1.1); }}><ZoomInIcon /></IconButton></Tooltip>
              <Tooltip title="Zoom Out"><IconButton onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom()*0.9); }}><ZoomOutIcon /></IconButton></Tooltip>
              <Tooltip title="Upload"><IconButton onClick={() => setImportDialog(true)}><UploadFileIcon /></IconButton></Tooltip>
            </Box>

            <Box sx={{ border: '2px solid #ccc', borderRadius: 2, overflow: 'auto', bgcolor: '#f5f5f5', width: '100%', minHeight: '500px' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '500px', display: 'block' }} />
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={saveDrawingToForm} startIcon={<SaveIcon />}>Save Canvas</Button>
              <Button variant="outlined" onClick={exportPDF} startIcon={<PrintIcon />}>Export PDF</Button>
              <Button variant="outlined" onClick={() => alert('Generate BOQ from drawing')} startIcon={<CheckCircleIcon />}>Generate BOQ</Button>
              <Button variant="outlined" onClick={() => alert('Generate Cost Estimate')} startIcon={<FileDownloadIcon />}>Cost Estimate</Button>
            </Box>
          </Box>
        )}

        {/* ─── Layers ─────────────────────────────────────────────────── */}
        {activeTab === 2 && (
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
          </Box>
        )}

        {/* ─── Approval ─────────────────────────────────────────────────── */}
        {activeTab === 3 && (
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
            {loading ? 'Saving...' : 'Save Drawing'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/drawings')}>Cancel</Button>
        </Box>
      </form>

      {/* ─── Import Dialog ──────────────────────────────────────────── */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Drawing</DialogTitle>
        <DialogContent>
          <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', cursor: 'pointer' }}>
            <input {...getInputProps()} />
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

export default DrawingForm;