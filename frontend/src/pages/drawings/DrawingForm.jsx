import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Switch
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import GridOnIcon from '@mui/icons-material/GridOn';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import * as fabric from 'fabric';

const drawingTypes = [
  { value: 'site_plan', label: 'Site Plan' },
  { value: 'building_plan', label: 'Building Plan' },
  { value: 'floor_plan', label: 'Floor Plan' },
  { value: 'foundation_plan', label: 'Foundation Plan' },
  { value: 'fence_plan', label: 'Fence Plan' },
  { value: 'road_design', label: 'Road Design' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'access_control', label: 'Access Control Layout' },
  { value: 'electrical', label: 'Electrical Layout' },
  { value: 'water_reticulation', label: 'Water Reticulation' },
  { value: 'topographic', label: 'Topographic Survey' },
];

const DrawingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    project: '',
    type: 'site_plan',
    status: 'draft',
    designer: '',
    checker: '',
    approver: '',
    canvasData: '',
    previewImage: '',
    drawingFileUrl: '',
    revisionNumber: 1,
  });
  const [message, setMessage] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [users, setUsers] = useState([]);

  // ─── Fetch projects & users ──────────────────────────
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
          if (data.canvasData && canvas) {
            canvas.loadFromJSON(JSON.parse(data.canvasData), () => canvas.renderAll());
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id, canvas]);

  // ─── Canvas initialization ──────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasEl = canvasRef.current;
    const width = canvasEl.clientWidth || 900;
    const height = canvasEl.clientHeight || 500;

    const fabricCanvas = new fabric.Canvas(canvasEl, {
      width: width,
      height: height,
      backgroundColor: '#f5f5f5',
    });
    if (showGrid) drawGrid(fabricCanvas);
    saveHistory(fabricCanvas);
    fabricCanvas.on('object:added', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:modified', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:removed', () => saveHistory(fabricCanvas));
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

  // ─── Grid ────────────────────────────────────────────
  const drawGrid = (fabricCanvas) => {
    const gridSize = 20;
    const w = fabricCanvas.getWidth();
    const h = fabricCanvas.getHeight();
    const oldLines = fabricCanvas.getObjects().filter(o => o.excludeFromExport);
    oldLines.forEach(o => fabricCanvas.remove(o));
    for (let i = 0; i < w; i += gridSize) {
      fabricCanvas.add(new fabric.Line([i, 0, i, h], { stroke: '#ddd', strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true }));
    }
    for (let i = 0; i < h; i += gridSize) {
      fabricCanvas.add(new fabric.Line([0, i, w, i], { stroke: '#ddd', strokeWidth: 0.5, selectable: false, evented: false, excludeFromExport: true }));
    }
    fabricCanvas.renderAll();
  };

  // ─── History ──────────────────────────────────────────
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

  // ─── Tool handlers ────────────────────────────────────
  const addShape = (type) => {
    if (!canvas) return;
    let shape;
    const props = { left: 100, top: 100, fill: 'rgba(0,123,255,0.2)', stroke: '#007bff', strokeWidth: 2, selectable: true };
    switch (type) {
      case 'rect': shape = new fabric.Rect({ ...props, width: 80, height: 60 }); break;
      case 'circle': shape = new fabric.Circle({ ...props, radius: 40 }); break;
      case 'line': shape = new fabric.Line([50, 50, 200, 200], { stroke: '#dc3545', strokeWidth: 3, selectable: true }); break;
      case 'polygon':
        shape = new fabric.Polygon([{x:0,y:0},{x:50,y:0},{x:50,y:50},{x:0,y:50}], { ...props, fill: 'rgba(40,167,69,0.3)', stroke: '#28a745' });
        break;
      case 'text': shape = new fabric.Textbox('Edit me', { left: 200, top: 200, fontSize: 20, fill: '#333', width: 200, selectable: true }); break;
      default: return;
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
    if (active) { canvas.remove(active); canvas.renderAll(); saveHistory(canvas); }
    else alert('Select an object first.');
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

  // ─── Add specific tools ──────────────────────────────
  const addBoundaryTool = () => addShape('polygon');
  const addFenceTool = () => {
    if (!canvas) return;
    const line = new fabric.Line([50,50,300,50], { stroke: '#8B4513', strokeWidth: 4, selectable: true });
    const posts = [];
    for (let i = 0; i < 6; i++) {
      const post = new fabric.Rect({ left: 50 + i*50, top: 40, width: 6, height: 20, fill: '#8B4513', selectable: true });
      posts.push(post);
    }
    const group = new fabric.Group([line, ...posts], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addBuildingTool = () => addShape('rect');
  const addRoadTool = () => addShape('line');
  const addDrainageTool = () => {
    if (!canvas) return;
    const line = new fabric.Line([50,150,350,150], { stroke: '#007bff', strokeWidth: 6, strokeDashArray: [8,4], selectable: true });
    canvas.add(line);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addGateTool = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({ left: 100, top: 200, width: 40, height: 60, fill: 'transparent', stroke: '#28a745', strokeWidth: 4, selectable: true });
    canvas.add(rect);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addCCTVTool = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({ left: 150, top: 150, radius: 12, fill: '#dc3545', stroke: '#fff', strokeWidth: 2, selectable: true });
    const text = new fabric.Text('CCTV', { left: 160, top: 140, fontSize: 12, fill: '#dc3545' });
    const group = new fabric.Group([circle, text], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addSecurityTool = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({ left: 200, top: 200, width: 20, height: 30, fill: '#ffc107', stroke: '#333', strokeWidth: 2, selectable: true });
    const text = new fabric.Text('Guard', { left: 200, top: 235, fontSize: 10, fill: '#333' });
    const group = new fabric.Group([rect, text], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addUtilityTool = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({ left: 250, top: 100, radius: 15, fill: '#17a2b8', stroke: '#fff', strokeWidth: 2, selectable: true });
    const text = new fabric.Text('Water', { left: 260, top: 90, fontSize: 10, fill: '#17a2b8' });
    const group = new fabric.Group([circle, text], { selectable: true });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
  };
  const addSurveyPointTool = () => {
    if (!canvas) return;
    const cross = new fabric.Group([
      new fabric.Line([-8,0,8,0], { stroke: '#dc3545', strokeWidth: 2 }),
      new fabric.Line([0,-8,0,8], { stroke: '#dc3545', strokeWidth: 2 }),
      new fabric.Circle({ radius: 4, fill: '#dc3545' })
    ], { left: 300, top: 300, selectable: true });
    canvas.add(cross);
    canvas.renderAll();
    saveHistory(canvas);
  };

  // ─── Save & Submit ──────────────────────────────────
  const saveDrawingToForm = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const dataUrl = canvas.toDataURL('image/png');
    setForm(prev => ({ ...prev, canvasData: JSON.stringify(json), previewImage: dataUrl }));
    setMessage({ type: 'success', text: 'Drawing saved to form!' });
  };

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

  // ─── Auto-Generate BOQ ──────────────────────────────
  const handleGenerateBOQ = async () => {
    if (!id) { alert('Save the drawing first.'); return; }
    try {
      await api.post(`/api/drawings/${id}/generate-boq`);
      setMessage({ type: 'success', text: 'BOQ generated! Check BOQ list.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'BOQ generation failed' });
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Drawing' : 'New Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Drawing Name *" name="name" fullWidth value={form.name} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Project" name="project" fullWidth value={form.project} onChange={handleChange} required>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Drawing Type" name="type" fullWidth value={form.type} onChange={handleChange}>
              {drawingTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Status" name="status" fullWidth value={form.status} onChange={handleChange}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="checked">Checked</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="issued">Issued</MenuItem>
              <MenuItem value="as_built">As Built</MenuItem>
            </TextField>
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
          <Grid item xs={12}>
            <TextField label="Revision Number" type="number" name="revisionNumber" fullWidth value={form.revisionNumber} onChange={handleChange} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* ─── Toolbar ──────────────────────────────────── */}
        <Typography variant="h6" gutterBottom>Drawing Canvas</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button variant={selectedTool === 'select' ? 'contained' : 'outlined'} size="small" onClick={() => { disableFreehand(); setSelectedTool('select'); }}>Select</Button>
          <Button variant={selectedTool === 'pencil' ? 'contained' : 'outlined'} size="small" onClick={enableFreehand}>Pencil</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('rect')}>Rect</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('circle')}>Circle</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('line')}>Line</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('polygon')}>Poly</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('text')}>Text</Button>
          <Tooltip title="Boundary"><IconButton size="small" onClick={addBoundaryTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Fence"><IconButton size="small" onClick={addFenceTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Building"><IconButton size="small" onClick={addBuildingTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Road"><IconButton size="small" onClick={addRoadTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Drainage"><IconButton size="small" onClick={addDrainageTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Gate"><IconButton size="small" onClick={addGateTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="CCTV"><IconButton size="small" onClick={addCCTVTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Security"><IconButton size="small" onClick={addSecurityTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Utility"><IconButton size="small" onClick={addUtilityTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Survey Point"><IconButton size="small" onClick={addSurveyPointTool}><AddIcon /></IconButton></Tooltip>
          <Tooltip title="Undo"><IconButton size="small" onClick={undo}><UndoIcon /></IconButton></Tooltip>
          <Tooltip title="Redo"><IconButton size="small" onClick={redo}><RedoIcon /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={handleDeleteSelected}><DeleteIcon /></IconButton></Tooltip>
          <Tooltip title="Clear"><IconButton size="small" color="error" onClick={handleClearCanvas}><ClearIcon /></IconButton></Tooltip>
          <Tooltip title="Grid"><IconButton size="small" color={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid(!showGrid)}><GridOnIcon /></IconButton></Tooltip>
          <Tooltip title="Zoom In"><IconButton size="small" onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom() * 1.1); }}><ZoomInIcon /></IconButton></Tooltip>
          <Tooltip title="Zoom Out"><IconButton size="small" onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom() * 0.9); }}><ZoomOutIcon /></IconButton></Tooltip>
          <Tooltip title="Save Drawing"><Button variant="contained" size="small" onClick={saveDrawingToForm}>Save Canvas</Button></Tooltip>
        </Box>

        {/* ─── Canvas with explicit height ────────────────────────────── */}
        <Box
          sx={{
            border: '2px solid #ccc',
            borderRadius: 2,
            overflow: 'auto',
            bgcolor: '#f5f5f5',
            width: '100%',
            minHeight: '500px',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '500px', display: 'block' }}
          />
        </Box>

        {/* ─── Actions ──────────────────────────────────── */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Drawing'}
          </Button>
          {id && (
            <Button variant="outlined" color="secondary" onClick={handleGenerateBOQ}>
              Generate BOQ
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate('/drawings')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default DrawingForm;