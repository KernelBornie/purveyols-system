import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, ListItemSecondaryAction, Switch, Slider, FormControlLabel
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

const SitePlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    project: '',
    type: 'site_plan',
    description: '',
    dimensions: '',
    scale: '',
    status: 'draft',
    surveyPoints: [],
    boundaryData: { perimeter: '', area: '', coordinates: [] },
    foundationType: '',
    soilType: '',
    waterTableLevel: '',
    drawingData: '',
    drawingImage: '',
  });
  const [message, setMessage] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [surveyPointDialog, setSurveyPointDialog] = useState(false);
  const [surveyPoint, setSurveyPoint] = useState({ label: '', x: '', y: '', z: '', description: '' });
  const [imageUploadDialog, setImageUploadDialog] = useState(false);

  // ─── Canvas initialization ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    // Use the explicit dimensions from the DOM
    const canvasEl = canvasRef.current;
    const width = canvasEl.clientWidth || 900;
    const height = canvasEl.clientHeight || 500;

    const fabricCanvas = new fabric.Canvas(canvasEl, {
      width: width,
      height: height,
      backgroundColor: '#f5f5f5',
      selection: true,
    });

    // Grid
    if (showGrid) {
      drawGrid(fabricCanvas);
    }

    // Load existing drawing
    if (form.drawingData) {
      fabricCanvas.loadFromJSON(JSON.parse(form.drawingData), () => {
        fabricCanvas.renderAll();
        saveHistory(fabricCanvas);
      });
    } else {
      saveHistory(fabricCanvas);
    }

    // Event listener for modifications
    fabricCanvas.on('object:added', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:modified', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:removed', () => saveHistory(fabricCanvas));

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // ─── Grid helper ──────────────────────────────────────────────────
  const drawGrid = (fabricCanvas) => {
    const gridSize = 20;
    const width = fabricCanvas.getWidth();
    const height = fabricCanvas.getHeight();
    // Remove old grid lines first (if any)
    const oldLines = fabricCanvas.getObjects().filter(o => o.excludeFromExport);
    oldLines.forEach(o => fabricCanvas.remove(o));
    for (let i = 0; i < width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#ddd',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
    }
    for (let i = 0; i < height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#ddd',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
    }
    fabricCanvas.renderAll();
  };

  // ─── History management ──────────────────────────────────────────
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

  // ─── Tool handlers ──────────────────────────────────────────────────
  const addShape = (type) => {
    if (!canvas) return;
    let shape;
    const props = {
      left: 100 + Math.random() * 100,
      top: 100 + Math.random() * 100,
      fill: 'rgba(0,123,255,0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
      selectable: true,
    };
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...props, width: 80, height: 60 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...props, radius: 40 });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 200], {
          stroke: '#dc3545',
          strokeWidth: 3,
          selectable: true,
        });
        break;
      case 'polygon':
        shape = new fabric.Polygon([
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
          { x: 0, y: 50 },
        ], { ...props, fill: 'rgba(40,167,69,0.3)', stroke: '#28a745' });
        break;
      case 'text':
        shape = new fabric.Textbox('Edit me', {
          left: 200,
          top: 200,
          fontSize: 20,
          fill: '#333',
          width: 200,
          selectable: true,
        });
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
    if (window.confirm('Clear all drawing? This cannot be undone.')) {
      canvas.clear();
      canvas.backgroundColor = '#f5f5f5';
      if (showGrid) drawGrid(canvas);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  // ─── Image upload ──────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.src = event.target.result;
      imgElement.onload = () => {
        const img = new fabric.Image(imgElement, {
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true,
        });
        canvas.add(img);
        canvas.renderAll();
        saveHistory(canvas);
        setImageUploadDialog(false);
      };
    };
    reader.readAsDataURL(file);
  };

  // ─── Survey points ──────────────────────────────────────────────────
  const addSurveyPoint = () => {
    if (!canvas) return;
    const { label, x, y, z, description } = surveyPoint;
    if (!label || !x || !y) {
      alert('Label, X, and Y are required.');
      return;
    }
    const circle = new fabric.Circle({
      left: parseFloat(x) * 2, // scaling for visibility
      top: parseFloat(y) * 2,
      radius: 6,
      fill: '#dc3545',
      stroke: '#fff',
      strokeWidth: 2,
      selectable: true,
    });
    const text = new fabric.Text(label, {
      left: parseFloat(x) * 2 + 10,
      top: parseFloat(y) * 2 - 8,
      fontSize: 14,
      fill: '#dc3545',
      selectable: true,
    });
    const group = new fabric.Group([circle, text], {
      selectable: true,
      left: parseFloat(x) * 2,
      top: parseFloat(y) * 2,
    });
    canvas.add(group);
    canvas.renderAll();
    saveHistory(canvas);
    // Save to surveyPoints array
    const points = [...(form.surveyPoints || [])];
    points.push({ label, x: parseFloat(x), y: parseFloat(y), z: parseFloat(z || 0), description });
    setForm({ ...form, surveyPoints: points });
    setSurveyPoint({ label: '', x: '', y: '', z: '', description: '' });
    setSurveyPointDialog(false);
  };

  // ─── Export ──────────────────────────────────────────────────────────
  const exportPNG = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${form.name || 'drawing'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // ─── Save drawing to form ──────────────────────────────────────────
  const saveDrawingToForm = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const dataUrl = canvas.toDataURL('image/png');
    setForm(prev => ({
      ...prev,
      drawingData: JSON.stringify(json),
      drawingImage: dataUrl,
    }));
    setMessage({ type: 'success', text: 'Drawing saved to plan!' });
  };

  // ─── Load form data ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/projects');
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        if (id) {
          const planRes = await api.get(`/api/site-plans/${id}`);
          const data = planRes.data;
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

  // ─── Submit form ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    saveDrawingToForm();
    setLoading(true);
    setMessage(null);
    try {
      if (id) {
        await api.put(`/api/site-plans/${id}`, form);
        setMessage({ type: 'success', text: 'Plan updated!' });
      } else {
        await api.post('/api/site-plans', form);
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

  const handleBoundaryChange = (field, value) => {
    setForm({
      ...form,
      boundaryData: { ...form.boundaryData, [field]: value },
    });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Plan / Drawing' : 'New Plan / Drawing'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Plan Name *"
              name="name"
              fullWidth
              value={form.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Project"
              name="project"
              fullWidth
              value={form.project}
              onChange={handleChange}
            >
              <MenuItem value="">None</MenuItem>
              {projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Type"
              name="type"
              fullWidth
              value={form.type}
              onChange={handleChange}
            >
              <MenuItem value="site_plan">Site Plan</MenuItem>
              <MenuItem value="fence_drawing">Fence Drawing</MenuItem>
              <MenuItem value="access_plan">Access Plan</MenuItem>
              <MenuItem value="boundary_fence">Boundary Fence</MenuItem>
              <MenuItem value="survey_data">Survey Data</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              label="Dimensions (e.g., 100m x 50m)"
              name="dimensions"
              fullWidth
              value={form.dimensions}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Scale (e.g., 1:100)"
              name="scale"
              fullWidth
              value={form.scale}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        {/* ─── Drawing Canvas Section ────────────────────────────────── */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Construction Drawing Canvas
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Tooltip title="Select/Move">
            <Button
              variant={selectedTool === 'select' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { disableFreehand(); setSelectedTool('select'); }}
            >
              Select
            </Button>
          </Tooltip>
          <Tooltip title="Freehand Pencil">
            <Button
              variant={selectedTool === 'pencil' ? 'contained' : 'outlined'}
              size="small"
              onClick={enableFreehand}
            >
              Pencil
            </Button>
          </Tooltip>
          <Button variant="outlined" size="small" onClick={() => addShape('rect')}>Rectangle</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('circle')}>Circle</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('line')}>Line</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('polygon')}>Polygon</Button>
          <Button variant="outlined" size="small" onClick={() => addShape('text')}>Text</Button>
          <Tooltip title="Upload Image">
            <IconButton size="small" color="primary" onClick={() => setImageUploadDialog(true)}>
              <ImageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Undo">
            <IconButton size="small" onClick={undo} disabled={historyIndex <= 0}>
              <UndoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton size="small" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <RedoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete selected">
            <IconButton size="small" color="error" onClick={handleDeleteSelected}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear all">
            <IconButton size="small" color="error" onClick={handleClearCanvas}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Grid">
            <IconButton size="small" color={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid(!showGrid)}>
              <GridOnIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom() * 1.1); }}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={() => { if (canvas) canvas.setZoom(canvas.getZoom() * 0.9); }}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Survey Point">
            <IconButton size="small" color="secondary" onClick={() => setSurveyPointDialog(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PNG">
            <Button variant="outlined" size="small" onClick={exportPNG}>Export</Button>
          </Tooltip>
          <Tooltip title="Save drawing to plan">
            <Button variant="contained" size="small" onClick={saveDrawingToForm}>Save Drawing</Button>
          </Tooltip>
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
            id="drawingCanvas"
            style={{ width: '100%', height: '500px', display: 'block' }}
          />
        </Box>

        {/* ─── Survey Data (optional) ────────────────────────────────── */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>Survey Data (optional)</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Foundation Type"
              name="foundationType"
              fullWidth
              value={form.foundationType || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Soil Type"
              name="soilType"
              fullWidth
              value={form.soilType || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Water Table Level (m)"
              name="waterTableLevel"
              type="number"
              fullWidth
              value={form.waterTableLevel || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Boundary Perimeter (m)"
              type="number"
              fullWidth
              value={form.boundaryData?.perimeter || ''}
              onChange={(e) => handleBoundaryChange('perimeter', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Boundary Area (m²)"
              type="number"
              fullWidth
              value={form.boundaryData?.area || ''}
              onChange={(e) => handleBoundaryChange('area', e.target.value)}
            />
          </Grid>
        </Grid>

        {/* ─── Submit ────────────────────────────────────────────────── */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Plan'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/site-plans')}>
            Cancel
          </Button>
        </Box>
      </form>

      {/* ─── Survey Point Dialog ────────────────────────────────────── */}
      <Dialog open={surveyPointDialog} onClose={() => setSurveyPointDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Survey Point</DialogTitle>
        <DialogContent>
          <TextField
            label="Label *"
            fullWidth
            margin="dense"
            value={surveyPoint.label}
            onChange={(e) => setSurveyPoint({ ...surveyPoint, label: e.target.value })}
          />
          <TextField
            label="X Coordinate *"
            type="number"
            fullWidth
            margin="dense"
            value={surveyPoint.x}
            onChange={(e) => setSurveyPoint({ ...surveyPoint, x: e.target.value })}
          />
          <TextField
            label="Y Coordinate *"
            type="number"
            fullWidth
            margin="dense"
            value={surveyPoint.y}
            onChange={(e) => setSurveyPoint({ ...surveyPoint, y: e.target.value })}
          />
          <TextField
            label="Z (Elevation)"
            type="number"
            fullWidth
            margin="dense"
            value={surveyPoint.z}
            onChange={(e) => setSurveyPoint({ ...surveyPoint, z: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            value={surveyPoint.description}
            onChange={(e) => setSurveyPoint({ ...surveyPoint, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSurveyPointDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addSurveyPoint}>Add Point</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Image Upload Dialog ────────────────────────────────────── */}
      <Dialog open={imageUploadDialog} onClose={() => setImageUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Image to Canvas</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
            Choose Image
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SitePlanForm;