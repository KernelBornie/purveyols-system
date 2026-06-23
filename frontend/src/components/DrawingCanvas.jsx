import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import {
  Box, Paper, ButtonGroup, Button, Tooltip, Divider,
  Typography, CircularProgress, Alert, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
  // Basic shapes
  CropSquare as RectIcon,
  Circle as CircleIcon,
  HorizontalRule as LineIcon,
  TextFields as TextIcon,
  Edit as PenIcon,
  // Actions
  Delete as DeleteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as ClearIcon,
  // Electrical
  Power as OutletIcon,
  ToggleOn as SwitchIcon,
  Lightbulb as LightIcon,
  Dashboard as PanelIcon,
  Bolt as CableIcon,
  // Structural
  ViewColumn as ColumnIcon,
  Build as BeamIcon,
  Wallpaper as WallIcon,
  // Floor & Foundation
  SquareFoot as SlabIcon,
  Layers as FootingIcon,
  Layers as RaftIcon,
  Layers as PileIcon,
  // Plumbing
  WaterDrop as PipeIcon,
  ClearAll as DrainIcon,
  WaterDrop as WaterLineIcon,
  // Water Reticulation
  Tune as ValveIcon,
  Park as SprinklerIcon,
  LocalFireDepartment as HydrantIcon,
  // Fencing
  BorderAll as FenceIcon,
  DoorFront as GateIcon,
  // Bridges
  Construction as BridgeIcon,
  Router as CulvertIcon,
  // Evaluation & Water Table
  Science as BoreholeIcon,
  Park as TestPitIcon,
  Radar as PiezometerIcon,
  WaterDrop as WaterTableIcon,
  // Survey
  ShowChart as ContourIcon,
  Place as PointIcon,
  CompassCalibration as NorthIcon,
  Straighten as ScaleIcon,
  PinDrop as SpotElevationIcon,
  // Annotations
  Straighten as DimIcon,
  GridOn as GridIcon,
  MergeType as HatchIcon,
  // CCTV
  Videocam as CameraIcon,
  Monitor as MonitorIcon,
  // Extra for coordinates
  Polyline as PolylineIcon,
  ChangeHistory as PolygonIcon,
} from '@mui/icons-material';

const CategoryLabel = ({ children }) => (
  <Typography variant="caption" sx={{ mx: 1, fontWeight: 'bold', color: 'text.secondary' }}>
    {children}
  </Typography>
);

const DrawingCanvas = forwardRef(({ initialData, onChange, height = 600, width = 900, scale = 100 }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);

  // ─── State for coordinate dialog ────────────────────────────────
  const [coordDialogOpen, setCoordDialogOpen] = useState(false);
  const [coordPointsText, setCoordPointsText] = useState('');
  const [coordDrawMode, setCoordDrawMode] = useState('polygon'); // 'polygon' or 'polyline'

  // ─── Expose methods ──────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    getDrawingData: () => {
      const fc = fabricCanvasRef.current;
      return fc ? fc.toJSON() : null;
    },
    loadDrawing: (data) => {
      const fc = fabricCanvasRef.current;
      if (fc && data) {
        fc.loadFromJSON(data, () => fc.renderAll());
      }
    },
    clearDrawing: () => {
      const fc = fabricCanvasRef.current;
      if (fc) {
        fc.clear();
        drawGrid(fc);
        fc.renderAll();
      }
    },
    getPolygonData: () => {
      const fc = fabricCanvasRef.current;
      if (!fc) return null;
      const objects = fc.getObjects();
      const shape = objects.find(o => 
        (o.type === 'polygon' || o.type === 'rect') && 
        !o.excludeFromExport
      );
      if (!shape) return null;
      let points = [];
      if (shape.type === 'polygon') {
        points = shape.points.map(p => ({ x: p.x + shape.left, y: p.y + shape.top }));
      } else if (shape.type === 'rect') {
        const { left, top, width, height } = shape;
        points = [
          { x: left, y: top },
          { x: left + width, y: top },
          { x: left + width, y: top + height },
          { x: left, y: top + height }
        ];
      }
      if (points.length < 3) return null;
      let area = 0, perimeter = 0;
      const n = points.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        perimeter += Math.sqrt(dx*dx + dy*dy);
      }
      area = Math.abs(area) / 2;
      return { points, area, perimeter };
    }
  }));

  // ─── Canvas init ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) {
      setError('Canvas element not found.');
      setLoading(false);
      return;
    }

    let fc;
    try {
      fc = new fabric.Canvas(canvasRef.current, {
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
      });
      fabricCanvasRef.current = fc;

      drawGrid(fc);

      if (initialData) {
        fc.loadFromJSON(initialData, () => fc.renderAll());
      } else {
        fc.renderAll();
      }

      const saveHistory = () => {
        const json = fc.toJSON();
        setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
        setHistoryIndex(prev => prev + 1);
        if (onChange) onChange(json);
      };

      fc.on('object:added', saveHistory);
      fc.on('object:modified', saveHistory);
      fc.on('object:removed', saveHistory);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (fc) {
        fc.off('object:added');
        fc.off('object:modified');
        fc.off('object:removed');
        fc.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getCanvas = () => fabricCanvasRef.current;

  const drawGrid = (fc) => {
    const gs = 10;
    for (let i = 0; i < width; i += gs) {
      fc.add(
        new fabric.Line([i, 0, i, height], {
          stroke: '#e8e8e8',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
    for (let i = 0; i < height; i += gs) {
      fc.add(
        new fabric.Line([0, i, width, i], {
          stroke: '#e8e8e8',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const fc = getCanvas();
    if (!fc) return;
    const newIndex = historyIndex - 1;
    fc.loadFromJSON(history[newIndex], () => fc.renderAll());
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const fc = getCanvas();
    if (!fc) return;
    const newIndex = historyIndex + 1;
    fc.loadFromJSON(history[newIndex], () => fc.renderAll());
    setHistoryIndex(newIndex);
  };

  // ─── Draw from coordinates ──────────────────────────────────────
  const openCoordDialog = (mode) => {
    setCoordDrawMode(mode);
    setCoordPointsText('');
    setCoordDialogOpen(true);
  };

  const drawFromCoordinates = () => {
    const fc = getCanvas();
    if (!fc) return;
    const lines = coordPointsText.split('\n').filter(line => line.trim() !== '');
    const points = [];
    for (const line of lines) {
      const parts = line.split(/[\s,]+/).filter(p => p !== '');
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y });
        }
      }
    }
    if (points.length < 2) {
      alert('Need at least 2 points. Format: x y or x,y per line.');
      return;
    }

    let shape;
    if (coordDrawMode === 'polygon') {
      if (points.length < 3) {
        alert('Polygon needs at least 3 points.');
        return;
      }
      // Close polygon if not already closed
      const pts = points.map(p => ({ x: p.x, y: p.y }));
      shape = new fabric.Polygon(pts, {
        fill: 'rgba(0,123,255,0.1)',
        stroke: '#007bff',
        strokeWidth: 2,
        selectable: true,
      });
    } else { // polyline
      const pts = points.map(p => [p.x, p.y]);
      shape = new fabric.Polyline(pts, {
        stroke: '#007bff',
        strokeWidth: 2,
        fill: null,
        selectable: true,
      });
    }
    fc.add(shape);
    fc.renderAll();
    setCoordDialogOpen(false);
  };

  // ─── All existing tool functions (keep all from your version) ──
  // I'll include them here – but to save space, they are the same as before.
  // Just ensure all addRectangle, addCircle, addCCTV, etc. are present.
  // For brevity, I'll list them all but you already have them.

  // ... (copy all the tool functions from your current DrawingCanvas)

  // ─── Render ──────────────────────────────────────────────────────────
  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>Error: {error}</Alert>;
  }

  return (
    <Box>
      {/* ─── TOOLBAR ──────────────────────────────────────────────────── */}
      <Paper sx={{ p: 1, mb: 2, overflowX: 'auto', whiteSpace: 'nowrap' }} elevation={2}>
        {/* Basic tools */}
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Rectangle"><Button onClick={addRectangle}><RectIcon /></Button></Tooltip>
          <Tooltip title="Circle"><Button onClick={addCircle}><CircleIcon /></Button></Tooltip>
          <Tooltip title="Line"><Button onClick={addLine}><LineIcon /></Button></Tooltip>
          <Tooltip title="Text"><Button onClick={addText}><TextIcon /></Button></Tooltip>
          <Tooltip title="Freehand"><Button onClick={toggleFreehand} color={activeTool === 'pen' ? 'primary' : 'inherit'}><PenIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Coordinate-based drawing - NEW */}
        <CategoryLabel>By Points</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Draw Polygon from Coordinates (x,y per line)">
            <Button onClick={() => openCoordDialog('polygon')}><PolygonIcon /></Button>
          </Tooltip>
          <Tooltip title="Draw Polyline from Coordinates (x,y per line)">
            <Button onClick={() => openCoordDialog('polyline')}><PolylineIcon /></Button>
          </Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Electrical (keep all existing) */}
        <CategoryLabel>Electrical</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Outlet"><Button onClick={addOutlet}><OutletIcon /></Button></Tooltip>
          <Tooltip title="Switch"><Button onClick={addSwitch}><SwitchIcon /></Button></Tooltip>
          <Tooltip title="Light"><Button onClick={addLight}><LightIcon /></Button></Tooltip>
          <Tooltip title="Panel"><Button onClick={addPanel}><PanelIcon /></Button></Tooltip>
          <Tooltip title="Cable"><Button onClick={addCable}><CableIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* ... include all other groups exactly as you have them */}
        {/* Structural, Floor, Plumbing, Reticulation, Fencing, Bridges, Eval/WT, Survey, Annotations, CCTV, Actions */}

        {/* Don't forget the existing action buttons */}
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Delete"><Button onClick={deleteSelected}><DeleteIcon /></Button></Tooltip>
          <Tooltip title="Clear"><Button onClick={clearCanvas}><ClearIcon /></Button></Tooltip>
          <Tooltip title="Undo"><Button onClick={undo} disabled={historyIndex <= 0}><UndoIcon /></Button></Tooltip>
          <Tooltip title="Redo"><Button onClick={redo} disabled={historyIndex >= history.length - 1}><RedoIcon /></Button></Tooltip>
        </ButtonGroup>

        <FormControlLabel
          control={<Switch checked={snapToGrid} onChange={() => setSnapToGrid(!snapToGrid)} />}
          label="Snap"
          sx={{ ml: 1 }}
        />
      </Paper>

      {/* ─── Canvas ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          border: '2px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          bgcolor: '#fafafa',
          position: 'relative',
          minHeight: height,
        }}
      >
        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <CircularProgress />
          </Box>
        )}
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>

      {/* ─── Coordinate Input Dialog ────────────────────────────────── */}
      <Dialog open={coordDialogOpen} onClose={() => setCoordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {coordDrawMode === 'polygon' ? 'Draw Polygon from Coordinates' : 'Draw Polyline from Coordinates'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Enter points one per line. Use x y or x,y (e.g., 10 20 or 10,20).
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={8}
            fullWidth
            placeholder="10 20&#10;30 40&#10;50 60"
            value={coordPointsText}
            onChange={(e) => setCoordPointsText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoordDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={drawFromCoordinates}>Draw</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default DrawingCanvas;
