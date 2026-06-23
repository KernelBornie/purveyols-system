import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

// MUI – adjust to your design system
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CropSquare as RectIcon,
  Circle as CircleIcon,
  HorizontalRule as LineIcon,
  TextFields as TextIcon,
  Edit as PenIcon,
  Delete as DeleteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  // Electrical
  Power as OutletIcon,
  ToggleOn as SwitchIcon,
  Lightbulb as LightIcon,
  Dashboard as PanelIcon,
  // Structural
  ViewColumn as ColumnIcon,
  Build as BeamIcon,
  Wallpaper as WallIcon,
  Layers as FootingIcon,
  // Plumbing
  Water as PipeIcon,
  Drain as DrainIcon,
  WaterDrop as WaterLineIcon,
  // Fencing
  Fence as FenceIcon,
  DoorFront as GateIcon,
  // Site
  ShowChart as ContourIcon,
  Place as PointIcon,
  CompassCalibration as NorthIcon,
  Straighten as ScaleIcon,
  // CCTV
  Videocam as CameraIcon,
  Cable as CableIcon,
  Monitor as MonitorIcon,
  // Dimension
  Straighten as DimIcon,
} from '@mui/icons-material';

// Helper to create a category label
const CategoryLabel = ({ children }) => (
  <Typography variant="caption" sx={{ mx: 1, fontWeight: 'bold', color: 'text.secondary' }}>
    {children}
  </Typography>
);

const DrawingForm = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(true);
  const [canvasError, setCanvasError] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- Canvas initialization (same as before) ---
  useEffect(() => {
    if (!canvasRef.current) {
      setCanvasError('Canvas element not found. Please refresh.');
      setCanvasLoading(false);
      return;
    }

    let fc;
    try {
      setCanvasLoading(true);
      setCanvasError(null);

      fc = new fabric.Canvas(canvasRef.current, {
        width: 1200,   // larger canvas for professional drawings
        height: 800,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
      });

      fabricCanvasRef.current = fc;

      // Grid (10px for precision)
      const gridSize = 10;
      for (let i = 0; i < 1200; i += gridSize) {
        fc.add(
          new fabric.Line([i, 0, i, 800], {
            stroke: '#e8e8e8',
            selectable: false,
            evented: false,
            excludeFromExport: true,
          })
        );
      }
      for (let i = 0; i < 800; i += gridSize) {
        fc.add(
          new fabric.Line([0, i, 1200, i], {
            stroke: '#e8e8e8',
            selectable: false,
            evented: false,
            excludeFromExport: true,
          })
        );
      }
      fc.renderAll();

      // History
      const saveHistory = () => {
        const json = fc.toJSON();
        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(json);
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      };

      fc.on('object:added', saveHistory);
      fc.on('object:modified', saveHistory);
      fc.on('object:removed', saveHistory);

      setCanvasReady(true);
      setCanvasLoading(false);
      console.log('✅ Professional canvas ready');
    } catch (err) {
      console.error(err);
      setCanvasError(err.message);
      setCanvasLoading(false);
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

  // --- Helpers ---
  const getCanvas = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) {
      setCanvasError('Canvas not ready');
      return null;
    }
    return fc;
  };

  // --- Undo / Redo ---
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

  // ============================================================
  //  TOOL FUNCTIONS – each creates a professional symbol
  // ============================================================

  // --- Basic Shapes (existing, enhanced) ---
  const addRectangle = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 100, top: 100, width: 120, height: 80,
      fill: 'rgba(0,123,255,0.1)', stroke: '#007bff', strokeWidth: 2,
    });
    fc.add(rect);
    fc.setActiveObject(rect);
    fc.renderAll();
  };

  const addCircle = () => {
    const fc = getCanvas();
    if (!fc) return;
    const circle = new fabric.Circle({
      left: 150, top: 150, radius: 50,
      fill: 'rgba(255,0,0,0.1)', stroke: '#dc3545', strokeWidth: 2,
    });
    fc.add(circle);
    fc.renderAll();
  };

  const addLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([50, 50, 300, 300], {
      stroke: '#000', strokeWidth: 2,
    });
    fc.add(line);
    fc.renderAll();
  };

  const addText = () => {
    const fc = getCanvas();
    if (!fc) return;
    const text = new fabric.Textbox('Edit me', {
      left: 200, top: 200, width: 200, fontSize: 20,
      textBaseline: 'alphabetic',
    });
    fc.add(text);
    fc.renderAll();
  };

  const toggleFreehand = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.isDrawingMode = !fc.isDrawingMode;
    if (fc.isDrawingMode) {
      fc.freeDrawingBrush = new fabric.PencilBrush(fc);
      fc.freeDrawingBrush.color = '#000';
      fc.freeDrawingBrush.width = 2;
      setActiveTool('pen');
    } else {
      setActiveTool('select');
    }
  };

  const deleteSelected = () => {
    const fc = getCanvas();
    if (!fc) return;
    const active = fc.getActiveObject();
    if (active) {
      fc.remove(active);
      fc.renderAll();
    }
  };

  const clearCanvas = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.clear();
    // Redraw grid
    const gridSize = 10;
    for (let i = 0; i < 1200; i += gridSize) {
      fc.add(
        new fabric.Line([i, 0, i, 800], {
          stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true,
        })
      );
    }
    for (let i = 0; i < 800; i += gridSize) {
      fc.add(
        new fabric.Line([0, i, 1200, i], {
          stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true,
        })
      );
    }
    fc.renderAll();
  };

  // --- Save / Load ---
  const saveDrawing = () => {
    const fc = getCanvas();
    if (!fc) return;
    const json = fc.toJSON();
    localStorage.setItem('drawing', JSON.stringify(json));
    alert('Drawing saved to localStorage');
  };

  const loadDrawing = () => {
    const fc = getCanvas();
    if (!fc) return;
    const saved = localStorage.getItem('drawing');
    if (!saved) { alert('No saved drawing found'); return; }
    fc.loadFromJSON(JSON.parse(saved), () => fc.renderAll());
  };

  // ============================================================
  //  PROFESSIONAL CONSTRUCTION TOOLS
  // ============================================================

  // ----- ELECTRICAL -----
  const addOutlet = () => {
    const fc = getCanvas();
    if (!fc) return;
    // Simple outlet symbol: a small rectangle with two circles
    const group = new fabric.Group([
      new fabric.Rect({ left: -15, top: -20, width: 30, height: 40, fill: '#fff', stroke: '#333', strokeWidth: 1 }),
      new fabric.Circle({ left: -8, top: -10, radius: 4, fill: '#333' }),
      new fabric.Circle({ left: 8, top: -10, radius: 4, fill: '#333' }),
    ], { left: 200, top: 200 });
    fc.add(group);
    fc.renderAll();
  };

  const addSwitch = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -20, top: -10, width: 40, height: 20, fill: '#fff', stroke: '#333', strokeWidth: 1 }),
      new fabric.Line([-10, -2, 10, -2], { stroke: '#333', strokeWidth: 2 }),
      new fabric.Triangle({ left: 12, top: -5, width: 10, height: 10, fill: '#333' }),
    ], { left: 250, top: 200 });
    fc.add(group);
    fc.renderAll();
  };

  const addLight = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#ffd700', stroke: '#333', strokeWidth: 1 }),
      new fabric.Line([0, -15, 0, -25], { stroke: '#333', strokeWidth: 1 }),
      new fabric.Line([-5, -20, 5, -20], { stroke: '#333', strokeWidth: 1 }),
    ], { left: 300, top: 200 });
    fc.add(group);
    fc.renderAll();
  };

  const addPanel = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 200, top: 300, width: 60, height: 80,
      fill: '#f0f0f0', stroke: '#333', strokeWidth: 2,
    });
    fc.add(rect);
    // Add some "breakers" lines
    for (let i = 0; i < 3; i++) {
      fc.add(new fabric.Line([210, 320 + i*20, 250, 320 + i*20], { stroke: '#333', strokeWidth: 1 }));
    }
    fc.renderAll();
  };

  // ----- STRUCTURAL -----
  const addColumn = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 150, top: 400, width: 30, height: 30,
      fill: '#cccccc', stroke: '#000', strokeWidth: 2,
    });
    fc.add(rect);
    fc.renderAll();
  };

  const addBeam = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 200, top: 450, width: 120, height: 20,
      fill: '#cccccc', stroke: '#000', strokeWidth: 2,
    });
    fc.add(rect);
    fc.renderAll();
  };

  const addWall = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 300, top: 500, width: 200, height: 10,
      fill: '#d3d3d3', stroke: '#000', strokeWidth: 1,
    });
    fc.add(rect);
    fc.renderAll();
  };

  const addFooting = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 100, top: 550, width: 80, height: 40,
      fill: '#b0b0b0', stroke: '#000', strokeWidth: 2,
    });
    fc.add(rect);
    fc.renderAll();
  };

  // ----- PLUMBING / DRAINAGE -----
  const addPipe = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([100, 100, 300, 100], {
      stroke: '#1e90ff', strokeWidth: 6, strokeDashArray: [10, 5],
    });
    fc.add(line);
    fc.renderAll();
  };

  const addDrain = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#fff', stroke: '#1e90ff', strokeWidth: 2 }),
      new fabric.Line([-10, -10, 10, 10], { stroke: '#1e90ff', strokeWidth: 2 }),
      new fabric.Line([-10, 10, 10, -10], { stroke: '#1e90ff', strokeWidth: 2 }),
    ], { left: 400, top: 100 });
    fc.add(group);
    fc.renderAll();
  };

  const addWaterLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([150, 200, 350, 200], {
      stroke: '#00bfff', strokeWidth: 4, strokeDashArray: [8, 4],
    });
    fc.add(line);
    fc.renderAll();
  };

  // ----- FENCING -----
  const addFencePost = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 500, top: 300, width: 8, height: 40,
      fill: '#8b4513', stroke: '#000', strokeWidth: 1,
    });
    fc.add(rect);
    fc.renderAll();
  };

  const addFenceLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([400, 320, 600, 320], {
      stroke: '#8b4513', strokeWidth: 3,
    });
    fc.add(line);
    // Add small posts along the line
    for (let i = 0; i < 5; i++) {
      fc.add(new fabric.Rect({
        left: 400 + i*50 - 3, top: 300, width: 6, height: 40,
        fill: '#8b4513', stroke: '#000', strokeWidth: 1,
      }));
    }
    fc.renderAll();
  };

  const addGate = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -20, top: -30, width: 40, height: 60, fill: '#cd853f', stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([-10, -20, -10, 20], { stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([10, -20, 10, 20], { stroke: '#000', strokeWidth: 1 }),
    ], { left: 550, top: 300 });
    fc.add(group);
    fc.renderAll();
  };

  // ----- SITE / SURVEY -----
  const addContour = () => {
    const fc = getCanvas();
    if (!fc) return;
    const points = [
      { x: 50, y: 50 },
      { x: 100, y: 80 },
      { x: 150, y: 60 },
      { x: 200, y: 120 },
      { x: 250, y: 100 },
    ];
    const line = new fabric.Polyline(points.map(p => [p.x, p.y]), {
      stroke: '#8b0000', strokeWidth: 2, fill: null,
    });
    fc.add(line);
    fc.renderAll();
  };

  const addSurveyPoint = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 5, fill: '#ff0000', stroke: '#000', strokeWidth: 1 }),
      new fabric.Text('BM', { left: 8, top: -8, fontSize: 12, fill: '#000' }),
    ], { left: 300, top: 150 });
    fc.add(group);
    fc.renderAll();
  };

  const addNorthArrow = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Line([0, -20, 0, 20], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Triangle({ left: 0, top: -20, width: 10, height: 10, fill: '#000', angle: 0 }),
      new fabric.Text('N', { left: -5, top: -30, fontSize: 14, fill: '#000' }),
    ], { left: 50, top: 50 });
    fc.add(group);
    fc.renderAll();
  };

  const addScaleBar = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Line([0, 0, 100, 0], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([0, -5, 0, 5], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([50, -5, 50, 5], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([100, -5, 100, 5], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Text('0', { left: -5, top: 6, fontSize: 10 }),
      new fabric.Text('50m', { left: 40, top: 6, fontSize: 10 }),
      new fabric.Text('100m', { left: 85, top: 6, fontSize: 10 }),
    ], { left: 800, top: 50 });
    fc.add(group);
    fc.renderAll();
  };

  // ----- CCTV -----
  const addCamera = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#333', stroke: '#000', strokeWidth: 1 }),
      new fabric.Rect({ left: -10, top: -20, width: 20, height: 8, fill: '#666', stroke: '#000' }),
      new fabric.Circle({ left: 0, top: 0, radius: 6, fill: '#1e90ff' }),
    ], { left: 700, top: 200 });
    fc.add(group);
    fc.renderAll();
  };

  const addCCTVMonitor = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -20, top: -15, width: 40, height: 30, fill: '#000', stroke: '#666', strokeWidth: 2 }),
      new fabric.Rect({ left: -15, top: -10, width: 30, height: 20, fill: '#00ff00' }),
    ], { left: 750, top: 200 });
    fc.add(group);
    fc.renderAll();
  };

  // ----- DIMENSION LINE -----
  const addDimension = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([100, 500, 400, 500], {
      stroke: '#000', strokeWidth: 1,
      strokeDashArray: [2, 2],
    });
    fc.add(line);
    fc.add(new fabric.Line([100, 495, 100, 505], { stroke: '#000', strokeWidth: 1 }));
    fc.add(new fabric.Line([400, 495, 400, 505], { stroke: '#000', strokeWidth: 1 }));
    fc.add(new fabric.Text('3000mm', { left: 230, top: 505, fontSize: 12, fill: '#000' }));
    fc.renderAll();
  };

  // ============================================================
  //  RENDER TOOLBAR (organised by category)
  // ============================================================

  if (canvasError) {
    return <Alert severity="error" sx={{ m: 2 }}>Canvas error: {canvasError}</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        🏗️ Professional Drawing Editor
      </Typography>

      {/* Toolbar - scrollable horizontally */}
      <Paper sx={{ p: 1, mb: 2, overflowX: 'auto', whiteSpace: 'nowrap' }} elevation={2}>
        {/* Basic */}
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Rectangle"><Button onClick={addRectangle}><RectIcon /></Button></Tooltip>
          <Tooltip title="Circle"><Button onClick={addCircle}><CircleIcon /></Button></Tooltip>
          <Tooltip title="Line"><Button onClick={addLine}><LineIcon /></Button></Tooltip>
          <Tooltip title="Text"><Button onClick={addText}><TextIcon /></Button></Tooltip>
          <Tooltip title="Freehand"><Button onClick={toggleFreehand} color={activeTool === 'pen' ? 'primary' : 'inherit'}><PenIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Electrical */}
        <CategoryLabel>Electrical</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Outlet"><Button onClick={addOutlet}><OutletIcon /></Button></Tooltip>
          <Tooltip title="Switch"><Button onClick={addSwitch}><SwitchIcon /></Button></Tooltip>
          <Tooltip title="Light"><Button onClick={addLight}><LightIcon /></Button></Tooltip>
          <Tooltip title="Panel"><Button onClick={addPanel}><PanelIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Structural */}
        <CategoryLabel>Structural</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Column"><Button onClick={addColumn}><ColumnIcon /></Button></Tooltip>
          <Tooltip title="Beam"><Button onClick={addBeam}><BeamIcon /></Button></Tooltip>
          <Tooltip title="Wall"><Button onClick={addWall}><WallIcon /></Button></Tooltip>
          <Tooltip title="Footing"><Button onClick={addFooting}><FootingIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Plumbing */}
        <CategoryLabel>Plumbing</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Pipe"><Button onClick={addPipe}><PipeIcon /></Button></Tooltip>
          <Tooltip title="Drain"><Button onClick={addDrain}><DrainIcon /></Button></Tooltip>
          <Tooltip title="Water Line"><Button onClick={addWaterLine}><WaterLineIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Fencing */}
        <CategoryLabel>Fencing</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Post"><Button onClick={addFencePost}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Fence Line"><Button onClick={addFenceLine}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Gate"><Button onClick={addGate}><GateIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Site / Survey */}
        <CategoryLabel>Site</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Contour"><Button onClick={addContour}><ContourIcon /></Button></Tooltip>
          <Tooltip title="Survey Point"><Button onClick={addSurveyPoint}><PointIcon /></Button></Tooltip>
          <Tooltip title="North Arrow"><Button onClick={addNorthArrow}><NorthIcon /></Button></Tooltip>
          <Tooltip title="Scale Bar"><Button onClick={addScaleBar}><ScaleIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* CCTV */}
        <CategoryLabel>CCTV</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Camera"><Button onClick={addCamera}><CameraIcon /></Button></Tooltip>
          <Tooltip title="Monitor"><Button onClick={addCCTVMonitor}><MonitorIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Dimension */}
        <CategoryLabel>Dimension</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Dimension Line"><Button onClick={addDimension}><DimIcon /></Button></Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Actions */}
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Delete"><Button onClick={deleteSelected}><DeleteIcon /></Button></Tooltip>
          <Tooltip title="Clear"><Button onClick={clearCanvas}><ClearIcon /></Button></Tooltip>
          <Tooltip title="Undo"><Button onClick={undo} disabled={historyIndex <= 0}><UndoIcon /></Button></Tooltip>
          <Tooltip title="Redo"><Button onClick={redo} disabled={historyIndex >= history.length - 1}><RedoIcon /></Button></Tooltip>
          <Tooltip title="Save"><Button onClick={saveDrawing}><SaveIcon /></Button></Tooltip>
          <Tooltip title="Load"><Button onClick={loadDrawing}><LoadIcon /></Button></Tooltip>
        </ButtonGroup>
      </Paper>

      {/* Canvas */}
      <Box
        sx={{
          border: '2px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          width: '100%',
          minHeight: '800px',
          bgcolor: '#fafafa',
          position: 'relative',
        }}
      >
        {canvasLoading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <CircularProgress />
          </Box>
        )}
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </Box>

      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {canvasReady ? '✅ Canvas ready – use tools above' : '⏳ Loading canvas...'}
      </Typography>
    </Box>
  );
};

export default DrawingForm;
