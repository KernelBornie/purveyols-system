import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import {
  Box, Paper, ButtonGroup, Button, Tooltip, Divider, IconButton,
  Typography, CircularProgress, Alert, Switch, FormControlLabel
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
} from '@mui/icons-material';

const CategoryLabel = ({ children }) => (
  <Typography variant="caption" sx={{ mx: 1, fontWeight: 'bold', color: 'text.secondary' }}>
    {children}
  </Typography>
);

const DrawingCanvas = forwardRef(({ initialData, onChange, height = 600, width = 900 }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);

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

  // ─── TOOL FUNCTIONS ──────────────────────────────────────────────
  const addRectangle = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(
      new fabric.Rect({
        left: 100, top: 100, width: 120, height: 80,
        fill: 'rgba(0,123,255,0.1)', stroke: '#007bff', strokeWidth: 2,
      })
    );
    fc.renderAll();
  };

  const addCircle = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(
      new fabric.Circle({
        left: 150, top: 150, radius: 50,
        fill: 'rgba(255,0,0,0.1)', stroke: '#dc3545', strokeWidth: 2,
      })
    );
    fc.renderAll();
  };

  const addLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([50, 50, 300, 300], { stroke: '#000', strokeWidth: 2 }));
    fc.renderAll();
  };

  const addText = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(
      new fabric.Textbox('Edit me', {
        left: 200, top: 200, width: 200, fontSize: 20,
        textBaseline: 'alphabetic',
      })
    );
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
    if (window.confirm('Clear all drawing?')) {
      fc.clear();
      drawGrid(fc);
      fc.renderAll();
    }
  };

  // ─── Professional Tools (all copied from DrawingForm) ──────────
  const addOutlet = () => {
    const fc = getCanvas();
    if (!fc) return;
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
    fc.add(new fabric.Rect({ left: 200, top: 300, width: 60, height: 80, fill: '#f0f0f0', stroke: '#333', strokeWidth: 2 }));
    for (let i = 0; i < 3; i++) {
      fc.add(new fabric.Line([210, 320 + i * 20, 250, 320 + i * 20], { stroke: '#333', strokeWidth: 1 }));
    }
    fc.renderAll();
  };

  const addCable = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([100, 100, 400, 100], { stroke: '#ff8c00', strokeWidth: 3, strokeDashArray: [6, 4] }));
    fc.renderAll();
  };

  const addColumn = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Rect({ left: 150, top: 400, width: 30, height: 30, fill: '#cccccc', stroke: '#000', strokeWidth: 2 }));
    fc.renderAll();
  };

  const addBeam = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Rect({ left: 200, top: 450, width: 120, height: 20, fill: '#cccccc', stroke: '#000', strokeWidth: 2 }));
    fc.renderAll();
  };

  const addWall = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Rect({ left: 300, top: 500, width: 200, height: 10, fill: '#d3d3d3', stroke: '#000', strokeWidth: 1 }));
    fc.renderAll();
  };

  const addFloorSlab = () => {
    const fc = getCanvas();
    if (!fc) return;
    const slab = new fabric.Rect({ left: 400, top: 400, width: 150, height: 100, fill: '#f5f5f5', stroke: '#000', strokeWidth: 2 });
    fc.add(slab);
    for (let i = 0; i < 10; i++) {
      fc.add(new fabric.Line([400 + i * 15, 400, 400 + i * 15, 500], { stroke: '#ccc', strokeWidth: 1, selectable: false }));
    }
    fc.renderAll();
  };

  const addStripFooting = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Rect({ left: 100, top: 550, width: 80, height: 30, fill: '#b0b0b0', stroke: '#000', strokeWidth: 2 }));
    fc.renderAll();
  };

  const addRaftFoundation = () => {
    const fc = getCanvas();
    if (!fc) return;
    const raft = new fabric.Rect({ left: 300, top: 600, width: 160, height: 80, fill: '#a0a0a0', stroke: '#000', strokeWidth: 2 });
    fc.add(raft);
    for (let i = 0; i < 4; i++) fc.add(new fabric.Line([300 + i * 40, 600, 300 + i * 40, 680], { stroke: '#666', strokeWidth: 1 }));
    for (let i = 0; i < 2; i++) fc.add(new fabric.Line([300, 600 + i * 40, 460, 600 + i * 40], { stroke: '#666', strokeWidth: 1 }));
    fc.renderAll();
  };

  const addPileFoundation = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -10, top: -40, width: 20, height: 80, fill: '#888', stroke: '#000', strokeWidth: 2 }),
      new fabric.Rect({ left: -15, top: -45, width: 30, height: 10, fill: '#aaa', stroke: '#000', strokeWidth: 1 }),
    ], { left: 500, top: 600 });
    fc.add(group);
    fc.renderAll();
  };

  const addPipe = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([100, 100, 300, 100], { stroke: '#1e90ff', strokeWidth: 6, strokeDashArray: [10, 5] }));
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
    fc.add(new fabric.Line([150, 200, 350, 200], { stroke: '#00bfff', strokeWidth: 4, strokeDashArray: [8, 4] }));
    fc.renderAll();
  };

  const addValve = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -10, top: -10, width: 20, height: 20, fill: '#ff4500', stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([-15, 0, -25, 0], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([15, 0, 25, 0], { stroke: '#000', strokeWidth: 2 }),
    ], { left: 300, top: 250 });
    fc.add(group);
    fc.renderAll();
  };

  const addSprinkler = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 10, fill: '#32cd32', stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([0, -10, -5, -20], { stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([0, -10, 5, -20], { stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([0, -10, 0, -25], { stroke: '#000', strokeWidth: 1 }),
    ], { left: 350, top: 250 });
    fc.add(group);
    fc.renderAll();
  };

  const addHydrant = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -8, top: -20, width: 16, height: 40, fill: '#ff0000', stroke: '#000', strokeWidth: 1 }),
      new fabric.Rect({ left: -15, top: -10, width: 30, height: 10, fill: '#ff3333', stroke: '#000', strokeWidth: 1 }),
    ], { left: 400, top: 250 });
    fc.add(group);
    fc.renderAll();
  };

  const addFencePost = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Rect({ left: 500, top: 300, width: 8, height: 40, fill: '#8b4513', stroke: '#000', strokeWidth: 1 }));
    fc.renderAll();
  };

  const addFenceLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([400, 320, 600, 320], { stroke: '#8b4513', strokeWidth: 3 }));
    for (let i = 0; i < 5; i++) {
      fc.add(new fabric.Rect({ left: 400 + i * 50 - 3, top: 300, width: 6, height: 40, fill: '#8b4513', stroke: '#000', strokeWidth: 1 }));
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

  const addBridge = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -50, top: -10, width: 100, height: 15, fill: '#a0a0a0', stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([-40, -10, -30, -30], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Line([40, -10, 30, -30], { stroke: '#000', strokeWidth: 2 }),
      new fabric.Rect({ left: -35, top: -30, width: 10, height: 40, fill: '#808080', stroke: '#000', strokeWidth: 1 }),
      new fabric.Rect({ left: 25, top: -30, width: 10, height: 40, fill: '#808080', stroke: '#000', strokeWidth: 1 }),
    ], { left: 600, top: 100 });
    fc.add(group);
    fc.renderAll();
  };

  const addCulvert = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -25, top: -15, width: 50, height: 30, fill: '#666', stroke: '#000', strokeWidth: 2 }),
      new fabric.Circle({ left: 0, top: 0, radius: 12, fill: '#333', stroke: '#000', strokeWidth: 1 }),
    ], { left: 700, top: 100 });
    fc.add(group);
    fc.renderAll();
  };

  const addBorehole = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 12, fill: '#8b0000', stroke: '#000', strokeWidth: 1 }),
      new fabric.Text('BH', { left: -8, top: -6, fontSize: 12, fill: '#fff' }),
      new fabric.Line([0, 12, 0, 40], { stroke: '#000', strokeWidth: 2, strokeDashArray: [2, 2] }),
    ], { left: 150, top: 500 });
    fc.add(group);
    fc.renderAll();
  };

  const addTestPit = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Rect({ left: -15, top: -15, width: 30, height: 30, fill: '#d2b48c', stroke: '#000', strokeWidth: 2 }),
      new fabric.Text('TP', { left: -8, top: -6, fontSize: 12, fill: '#000' }),
    ], { left: 200, top: 500 });
    fc.add(group);
    fc.renderAll();
  };

  const addPiezometer = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 8, fill: '#00bfff', stroke: '#000', strokeWidth: 1 }),
      new fabric.Line([0, 8, 0, 35], { stroke: '#000', strokeWidth: 1, strokeDashArray: [2, 2] }),
      new fabric.Text('PZ', { left: -10, top: -10, fontSize: 10, fill: '#000' }),
    ], { left: 250, top: 500 });
    fc.add(group);
    fc.renderAll();
  };

  const addGroundwaterLevel = () => {
    const fc = getCanvas();
    if (!fc) return;
    const grp = new fabric.Group([
      new fabric.Text('▼ GWT', { left: -20, top: -20, fontSize: 14, fill: '#0066cc', fontWeight: 'bold' }),
      new fabric.Line([-30, 0, 30, 0], { stroke: '#0066cc', strokeWidth: 2, strokeDashArray: [5, 5] }),
    ], { left: 300, top: 450 });
    fc.add(grp);
    fc.renderAll();
  };

  const addContour = () => {
    const fc = getCanvas();
    if (!fc) return;
    const pts = [{ x: 50, y: 50 }, { x: 100, y: 80 }, { x: 150, y: 60 }, { x: 200, y: 120 }, { x: 250, y: 100 }];
    fc.add(
      new fabric.Polyline(pts.map(p => [p.x, p.y]), { stroke: '#8b0000', strokeWidth: 2, fill: null })
    );
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
      new fabric.Triangle({ left: 0, top: -20, width: 10, height: 10, fill: '#000' }),
      new fabric.Text('N', { left: -5, top: -32, fontSize: 14, fill: '#000' }),
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

  const addSpotElevation = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 4, fill: '#000' }),
      new fabric.Text('+145.2m', { left: 6, top: -8, fontSize: 12, fill: '#000', fontWeight: 'bold' }),
    ], { left: 600, top: 400 });
    fc.add(group);
    fc.renderAll();
  };

  const addGridLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group([
      new fabric.Circle({ left: 0, top: 0, radius: 10, fill: '#fff', stroke: '#000', strokeWidth: 1 }),
      new fabric.Text('A', { left: -4, top: -7, fontSize: 12, fill: '#000' }),
      new fabric.Line([0, -10, 0, -200], { stroke: '#000', strokeWidth: 1, strokeDashArray: [5, 5] }),
    ], { left: 100, top: 100 });
    fc.add(group);
    fc.renderAll();
  };

  const addDimension = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([100, 500, 400, 500], { stroke: '#000', strokeWidth: 1, strokeDashArray: [2, 2] }));
    fc.add(new fabric.Line([100, 495, 100, 505], { stroke: '#000', strokeWidth: 1 }));
    fc.add(new fabric.Line([400, 495, 400, 505], { stroke: '#000', strokeWidth: 1 }));
    fc.add(new fabric.Text('3000mm', { left: 230, top: 505, fontSize: 12, fill: '#000' }));
    fc.renderAll();
  };

  const addHatch = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({ left: 700, top: 400, width: 80, height: 60, fill: '#e0e0e0', stroke: '#000', strokeWidth: 1 });
    fc.add(rect);
    for (let i = 0; i < 6; i++) {
      fc.add(new fabric.Line([700 + i * 15, 400, 700 + i * 15, 460], { stroke: '#ccc', strokeWidth: 1, selectable: false }));
    }
    for (let i = 0; i < 4; i++) {
      fc.add(new fabric.Line([700, 400 + i * 20, 780, 400 + i * 20], { stroke: '#ccc', strokeWidth: 1, selectable: false }));
    }
    fc.renderAll();
  };

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

  // ─── Render ──────────────────────────────────────────────────────────
  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>Error: {error}</Alert>;
  }

  return (
    <Box>
      {/* ─── TOOLBAR ──────────────────────────────────────────────────── */}
      <Paper sx={{ p: 1, mb: 2, overflowX: 'auto', whiteSpace: 'nowrap' }} elevation={2}>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Rectangle"><Button onClick={addRectangle}><RectIcon /></Button></Tooltip>
          <Tooltip title="Circle"><Button onClick={addCircle}><CircleIcon /></Button></Tooltip>
          <Tooltip title="Line"><Button onClick={addLine}><LineIcon /></Button></Tooltip>
          <Tooltip title="Text"><Button onClick={addText}><TextIcon /></Button></Tooltip>
          <Tooltip title="Freehand"><Button onClick={toggleFreehand} color={activeTool === 'pen' ? 'primary' : 'inherit'}><PenIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Electrical</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Outlet"><Button onClick={addOutlet}><OutletIcon /></Button></Tooltip>
          <Tooltip title="Switch"><Button onClick={addSwitch}><SwitchIcon /></Button></Tooltip>
          <Tooltip title="Light"><Button onClick={addLight}><LightIcon /></Button></Tooltip>
          <Tooltip title="Panel"><Button onClick={addPanel}><PanelIcon /></Button></Tooltip>
          <Tooltip title="Cable"><Button onClick={addCable}><CableIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Structural</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Column"><Button onClick={addColumn}><ColumnIcon /></Button></Tooltip>
          <Tooltip title="Beam"><Button onClick={addBeam}><BeamIcon /></Button></Tooltip>
          <Tooltip title="Wall"><Button onClick={addWall}><WallIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Floor / Found.</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Slab"><Button onClick={addFloorSlab}><SlabIcon /></Button></Tooltip>
          <Tooltip title="Strip"><Button onClick={addStripFooting}><FootingIcon /></Button></Tooltip>
          <Tooltip title="Raft"><Button onClick={addRaftFoundation}><RaftIcon /></Button></Tooltip>
          <Tooltip title="Pile"><Button onClick={addPileFoundation}><PileIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Plumbing</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Pipe"><Button onClick={addPipe}><PipeIcon /></Button></Tooltip>
          <Tooltip title="Drain"><Button onClick={addDrain}><DrainIcon /></Button></Tooltip>
          <Tooltip title="Water Line"><Button onClick={addWaterLine}><WaterLineIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Reticulation</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Valve"><Button onClick={addValve}><ValveIcon /></Button></Tooltip>
          <Tooltip title="Sprinkler"><Button onClick={addSprinkler}><SprinklerIcon /></Button></Tooltip>
          <Tooltip title="Hydrant"><Button onClick={addHydrant}><HydrantIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Fencing</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Post"><Button onClick={addFencePost}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Fence"><Button onClick={addFenceLine}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Gate"><Button onClick={addGate}><GateIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Bridges</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Bridge"><Button onClick={addBridge}><BridgeIcon /></Button></Tooltip>
          <Tooltip title="Culvert"><Button onClick={addCulvert}><CulvertIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Eval / WT</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Borehole"><Button onClick={addBorehole}><BoreholeIcon /></Button></Tooltip>
          <Tooltip title="Test Pit"><Button onClick={addTestPit}><TestPitIcon /></Button></Tooltip>
          <Tooltip title="Piezometer"><Button onClick={addPiezometer}><PiezometerIcon /></Button></Tooltip>
          <Tooltip title="GWT"><Button onClick={addGroundwaterLevel}><WaterTableIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Survey</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Contour"><Button onClick={addContour}><ContourIcon /></Button></Tooltip>
          <Tooltip title="Point"><Button onClick={addSurveyPoint}><PointIcon /></Button></Tooltip>
          <Tooltip title="North"><Button onClick={addNorthArrow}><NorthIcon /></Button></Tooltip>
          <Tooltip title="Scale"><Button onClick={addScaleBar}><ScaleIcon /></Button></Tooltip>
          <Tooltip title="Spot Elev."><Button onClick={addSpotElevation}><SpotElevationIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>Annotations</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Grid"><Button onClick={addGridLine}><GridIcon /></Button></Tooltip>
          <Tooltip title="Dim"><Button onClick={addDimension}><DimIcon /></Button></Tooltip>
          <Tooltip title="Hatch"><Button onClick={addHatch}><HatchIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <CategoryLabel>CCTV</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Camera"><Button onClick={addCamera}><CameraIcon /></Button></Tooltip>
          <Tooltip title="Monitor"><Button onClick={addCCTVMonitor}><MonitorIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

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
    </Box>
  );
});

export default DrawingCanvas;
