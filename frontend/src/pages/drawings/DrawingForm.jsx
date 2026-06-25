import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

import {
  Box, Button, ButtonGroup, Typography, Alert, CircularProgress,
  Paper, Divider, Tooltip, Tabs, Tab, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  // Basic shapes
  CropSquare as RectIcon,
  Circle as CircleIcon,
  HorizontalRule as LineIcon,
  TextFields as TextIcon,
  Edit as PenIcon,
  // Actions
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
  // Bridges & Civil
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

const DrawingForm = () => {
  // ─── Multi‑drawing state ──────────────────────────────────────────
  const [drawings, setDrawings] = useState([
    { id: '1', name: 'Drawing 1', data: null, history: [], historyIndex: -1 },
  ]);
  const [activeId, setActiveId] = useState('1');
  const [openDialog, setOpenDialog] = useState(false);
  const [newDrawingName, setNewDrawingName] = useState('');

  // ─── Canvas refs ──────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // ─── UI state ─────────────────────────────────────────────────────
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(true);
  const [canvasError, setCanvasError] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);

  const currentDrawing = drawings.find(d => d.id === activeId);

  // ─── Canvas init ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) {
      setCanvasError('Canvas element not found.');
      setCanvasLoading(false);
      return;
    }

    let fc;
    try {
      setCanvasLoading(true);
      fc = new fabric.Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
      });
      fabricCanvasRef.current = fc;

      drawGrid(fc);

      const drawing = drawings.find(d => d.id === activeId);
      if (drawing && drawing.data) {
        fc.loadFromJSON(drawing.data, () => fc.renderAll());
      } else {
        fc.renderAll();
      }

      const saveHistory = () => {
        const json = fc.toJSON();
        setDrawings(prev =>
          prev.map(d =>
            d.id === activeId
              ? {
                  ...d,
                  history: [...d.history.slice(0, d.historyIndex + 1), json],
                  historyIndex: d.historyIndex + 1,
                }
              : d
          )
        );
      };

      fc.on('object:added', saveHistory);
      fc.on('object:modified', saveHistory);
      fc.on('object:removed', saveHistory);

      setCanvasReady(true);
      setCanvasLoading(false);
    } catch (err) {
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
  }, [activeId]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getCanvas = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) {
      setCanvasError('Canvas not ready');
      return null;
    }
    return fc;
  };

  const drawGrid = (fc) => {
    const gs = 10;
    for (let i = 0; i < 1200; i += gs) {
      fc.add(
        new fabric.Line([i, 0, i, 800], {
          stroke: '#e8e8e8',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
    for (let i = 0; i < 800; i += gs) {
      fc.add(
        new fabric.Line([0, i, 1200, i], {
          stroke: '#e8e8e8',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
  };

  const saveCurrentDrawingData = () => {
    const fc = getCanvas();
    if (!fc) return;
    const json = fc.toJSON();
    setDrawings(prev =>
      prev.map(d =>
        d.id === activeId ? { ...d, data: json } : d
      )
    );
  };

  const switchDrawing = (id) => {
    if (id === activeId) return;
    saveCurrentDrawingData();
    setActiveId(id);
  };

  const addDrawing = () => {
    const newId = Date.now().toString();
    const newDrawing = {
      id: newId,
      name: newDrawingName || `Drawing ${drawings.length + 1}`,
      data: null,
      history: [],
      historyIndex: -1,
    };
    setDrawings([...drawings, newDrawing]);
    setActiveId(newId);
    setOpenDialog(false);
    setNewDrawingName('');
  };

  const deleteDrawing = (id) => {
    if (drawings.length <= 1) {
      alert('Cannot delete the last drawing.');
      return;
    }
    if (window.confirm(`Delete "${drawings.find(d => d.id === id)?.name}"?`)) {
      setDrawings(drawings.filter(d => d.id !== id));
      if (id === activeId) {
        setActiveId(drawings[0].id);
      }
    }
  };

  const undo = () => {
    const drawing = drawings.find(d => d.id === activeId);
    if (!drawing || drawing.historyIndex <= 0) return;
    const fc = getCanvas();
    if (!fc) return;
    const newIndex = drawing.historyIndex - 1;
    fc.loadFromJSON(drawing.history[newIndex], () => fc.renderAll());
    setDrawings(prev =>
      prev.map(d =>
        d.id === activeId ? { ...d, historyIndex: newIndex } : d
      )
    );
  };

  const redo = () => {
    const drawing = drawings.find(d => d.id === activeId);
    if (!drawing || drawing.historyIndex >= drawing.history.length - 1) return;
    const fc = getCanvas();
    if (!fc) return;
    const newIndex = drawing.historyIndex + 1;
    fc.loadFromJSON(drawing.history[newIndex], () => fc.renderAll());
    setDrawings(prev =>
      prev.map(d =>
        d.id === activeId ? { ...d, historyIndex: newIndex } : d
      )
    );
  };

  const saveAllDrawings = () => {
    saveCurrentDrawingData();
    localStorage.setItem('drawings', JSON.stringify(drawings));
    alert('All drawings saved.');
  };

  const loadAllDrawings = () => {
    const saved = localStorage.getItem('drawings');
    if (!saved) return alert('No saved drawings.');
    const parsed = JSON.parse(saved);
    setDrawings(parsed);
    setActiveId(parsed[0]?.id || '1');
    alert('Drawings loaded.');
  };

  // ─── BASIC TOOLS ─────────────────────────────────────────────────
  const addRectangle = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(
      new fabric.Rect({
        left: 100,
        top: 100,
        width: 120,
        height: 80,
        fill: 'rgba(0,123,255,0.1)',
        stroke: '#007bff',
        strokeWidth: 2,
      })
    );
    fc.renderAll();
  };

  const addCircle = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(
      new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: 'rgba(255,0,0,0.1)',
        stroke: '#dc3545',
        strokeWidth: 2,
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
        left: 200,
        top: 200,
        width: 200,
        fontSize: 20,
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

  // ─── CUSTOM PRINT ────────────────────────────────────────────────
  const handlePrint = () => {
    const fc = getCanvas();
    if (!fc) {
      alert('Canvas not ready.');
      return;
    }
    const dataURL = fc.toDataURL({ format: 'png', quality: 1 });
    const drawingName = currentDrawing?.name || 'Untitled';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Drawing - ${drawingName}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
            .print-container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #b71c1c; }
            .header .subtitle { font-weight: bold; font-size: 14px; margin: 2px 0; color: #b71c1c; }
            .header .details { font-size: 11px; margin: 1px 0; }
            .title-row { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; }
            .title-row .left { font-weight: bold; font-size: 18px; letter-spacing: 2px; color: #b71c1c; }
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
              <span class="left">DRAWING</span>
              <span>${drawingName}</span>
            </div>
            <img src="${dataURL}" class="canvas-image" alt="Drawing" />
            <div class="footer">PURVEYOLS CMS - Construction Management System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── PROFESSIONAL TOOLS (all are defined here) ──────────────────

  // Electrical
  const addOutlet = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -15, top: -20, width: 30, height: 40, fill: '#fff', stroke: '#333', strokeWidth: 1 }),
        new fabric.Circle({ left: -8, top: -10, radius: 4, fill: '#333' }),
        new fabric.Circle({ left: 8, top: -10, radius: 4, fill: '#333' }),
      ],
      { left: 200, top: 200 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addSwitch = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -20, top: -10, width: 40, height: 20, fill: '#fff', stroke: '#333', strokeWidth: 1 }),
        new fabric.Line([-10, -2, 10, -2], { stroke: '#333', strokeWidth: 2 }),
        new fabric.Triangle({ left: 12, top: -5, width: 10, height: 10, fill: '#333' }),
      ],
      { left: 250, top: 200 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addLight = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#ffd700', stroke: '#333', strokeWidth: 1 }),
        new fabric.Line([0, -15, 0, -25], { stroke: '#333', strokeWidth: 1 }),
        new fabric.Line([-5, -20, 5, -20], { stroke: '#333', strokeWidth: 1 }),
      ],
      { left: 300, top: 200 }
    );
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

  // Structural
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

  // Floor & Foundation
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
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -10, top: -40, width: 20, height: 80, fill: '#888', stroke: '#000', strokeWidth: 2 }),
        new fabric.Rect({ left: -15, top: -45, width: 30, height: 10, fill: '#aaa', stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 500, top: 600 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Plumbing
  const addPipe = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([100, 100, 300, 100], { stroke: '#1e90ff', strokeWidth: 6, strokeDashArray: [10, 5] }));
    fc.renderAll();
  };

  const addDrain = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#fff', stroke: '#1e90ff', strokeWidth: 2 }),
        new fabric.Line([-10, -10, 10, 10], { stroke: '#1e90ff', strokeWidth: 2 }),
        new fabric.Line([-10, 10, 10, -10], { stroke: '#1e90ff', strokeWidth: 2 }),
      ],
      { left: 400, top: 100 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addWaterLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    fc.add(new fabric.Line([150, 200, 350, 200], { stroke: '#00bfff', strokeWidth: 4, strokeDashArray: [8, 4] }));
    fc.renderAll();
  };

  // Water Reticulation
  const addValve = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -10, top: -10, width: 20, height: 20, fill: '#ff4500', stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([-15, 0, -25, 0], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([15, 0, 25, 0], { stroke: '#000', strokeWidth: 2 }),
      ],
      { left: 300, top: 250 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addSprinkler = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 10, fill: '#32cd32', stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([0, -10, -5, -20], { stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([0, -10, 5, -20], { stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([0, -10, 0, -25], { stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 350, top: 250 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addHydrant = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -8, top: -20, width: 16, height: 40, fill: '#ff0000', stroke: '#000', strokeWidth: 1 }),
        new fabric.Rect({ left: -15, top: -10, width: 30, height: 10, fill: '#ff3333', stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 400, top: 250 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Fencing
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
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -20, top: -30, width: 40, height: 60, fill: '#cd853f', stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([-10, -20, -10, 20], { stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([10, -20, 10, 20], { stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 550, top: 300 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Bridges
  const addBridge = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -50, top: -10, width: 100, height: 15, fill: '#a0a0a0', stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([-40, -10, -30, -30], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([40, -10, 30, -30], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Rect({ left: -35, top: -30, width: 10, height: 40, fill: '#808080', stroke: '#000', strokeWidth: 1 }),
        new fabric.Rect({ left: 25, top: -30, width: 10, height: 40, fill: '#808080', stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 600, top: 100 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addCulvert = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -25, top: -15, width: 50, height: 30, fill: '#666', stroke: '#000', strokeWidth: 2 }),
        new fabric.Circle({ left: 0, top: 0, radius: 12, fill: '#333', stroke: '#000', strokeWidth: 1 }),
      ],
      { left: 700, top: 100 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Evaluation
  const addBorehole = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 12, fill: '#8b0000', stroke: '#000', strokeWidth: 1 }),
        new fabric.Text('BH', { left: -8, top: -6, fontSize: 12, fill: '#fff' }),
        new fabric.Line([0, 12, 0, 40], { stroke: '#000', strokeWidth: 2, strokeDashArray: [2, 2] }),
      ],
      { left: 150, top: 500 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addTestPit = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -15, top: -15, width: 30, height: 30, fill: '#d2b48c', stroke: '#000', strokeWidth: 2 }),
        new fabric.Text('TP', { left: -8, top: -6, fontSize: 12, fill: '#000' }),
      ],
      { left: 200, top: 500 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Water Table
  const addPiezometer = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 8, fill: '#00bfff', stroke: '#000', strokeWidth: 1 }),
        new fabric.Line([0, 8, 0, 35], { stroke: '#000', strokeWidth: 1, strokeDashArray: [2, 2] }),
        new fabric.Text('PZ', { left: -10, top: -10, fontSize: 10, fill: '#000' }),
      ],
      { left: 250, top: 500 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addGroundwaterLevel = () => {
    const fc = getCanvas();
    if (!fc) return;
    const grp = new fabric.Group(
      [
        new fabric.Text('▼ GWT', { left: -20, top: -20, fontSize: 14, fill: '#0066cc', fontWeight: 'bold' }),
        new fabric.Line([-30, 0, 30, 0], { stroke: '#0066cc', strokeWidth: 2, strokeDashArray: [5, 5] }),
      ],
      { left: 300, top: 450 }
    );
    fc.add(grp);
    fc.renderAll();
  };

  // Survey
  const addContour = () => {
    const fc = getCanvas();
    if (!fc) return;
    const pts = [
      { x: 50, y: 50 },
      { x: 100, y: 80 },
      { x: 150, y: 60 },
      { x: 200, y: 120 },
      { x: 250, y: 100 },
    ];
    fc.add(
      new fabric.Polyline(
        pts.map(p => [p.x, p.y]),
        { stroke: '#8b0000', strokeWidth: 2, fill: null }
      )
    );
    fc.renderAll();
  };

  const addSurveyPoint = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 5, fill: '#ff0000', stroke: '#000', strokeWidth: 1 }),
        new fabric.Text('BM', { left: 8, top: -8, fontSize: 12, fill: '#000' }),
      ],
      { left: 300, top: 150 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addNorthArrow = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Line([0, -20, 0, 20], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Triangle({ left: 0, top: -20, width: 10, height: 10, fill: '#000' }),
        new fabric.Text('N', { left: -5, top: -32, fontSize: 14, fill: '#000' }),
      ],
      { left: 50, top: 50 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addScaleBar = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Line([0, 0, 100, 0], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([0, -5, 0, 5], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([50, -5, 50, 5], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([100, -5, 100, 5], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Text('0', { left: -5, top: 6, fontSize: 10 }),
        new fabric.Text('50m', { left: 40, top: 6, fontSize: 10 }),
        new fabric.Text('100m', { left: 85, top: 6, fontSize: 10 }),
      ],
      { left: 800, top: 50 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addSpotElevation = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 4, fill: '#000' }),
        new fabric.Text('+145.2m', { left: 6, top: -8, fontSize: 12, fill: '#000', fontWeight: 'bold' }),
      ],
      { left: 600, top: 400 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // Annotations
  const addGridLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 10, fill: '#fff', stroke: '#000', strokeWidth: 1 }),
        new fabric.Text('A', { left: -4, top: -7, fontSize: 12, fill: '#000' }),
        new fabric.Line([0, -10, 0, -200], { stroke: '#000', strokeWidth: 1, strokeDashArray: [5, 5] }),
      ],
      { left: 100, top: 100 }
    );
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

  // CCTV
  const addCamera = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Circle({ left: 0, top: 0, radius: 15, fill: '#333', stroke: '#000', strokeWidth: 1 }),
        new fabric.Rect({ left: -10, top: -20, width: 20, height: 8, fill: '#666', stroke: '#000' }),
        new fabric.Circle({ left: 0, top: 0, radius: 6, fill: '#1e90ff' }),
      ],
      { left: 700, top: 200 }
    );
    fc.add(group);
    fc.renderAll();
  };

  const addCCTVMonitor = () => {
    const fc = getCanvas();
    if (!fc) return;
    const group = new fabric.Group(
      [
        new fabric.Rect({ left: -20, top: -15, width: 40, height: 30, fill: '#000', stroke: '#666', strokeWidth: 2 }),
        new fabric.Rect({ left: -15, top: -10, width: 30, height: 20, fill: '#00ff00' }),
      ],
      { left: 750, top: 200 }
    );
    fc.add(group);
    fc.renderAll();
  };

  // ─── RENDER ──────────────────────────────────────────────────────────
  if (canvasError) {
    return <Alert severity="error" sx={{ m: 2 }}>Error: {canvasError}</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
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
        <Typography variant="h5" gutterBottom>🏗️ Professional Drawing Suite</Typography>
        <Button variant="outlined" onClick={handlePrint}>Print Drawing</Button>
      </Box>

      {/* Drawing tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Tabs
          value={activeId}
          onChange={(e, newId) => switchDrawing(newId)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1 }}
        >
          {drawings.map(d => (
            <Tab
              key={d.id}
              value={d.id}
              label={d.name}
              icon={
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDrawing(d.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
              iconPosition="end"
            />
          ))}
        </Tabs>
        <Button startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} sx={{ ml: 1 }}>
          New
        </Button>
        <Button startIcon={<SaveIcon />} onClick={saveAllDrawings} sx={{ ml: 1 }}>
          Save All
        </Button>
        <Button startIcon={<LoadIcon />} onClick={loadAllDrawings} sx={{ ml: 1 }}>
          Load All
        </Button>
        <FormControlLabel
          control={<Switch checked={snapToGrid} onChange={() => setSnapToGrid(!snapToGrid)} />}
          label="Snap"
          sx={{ ml: 2 }}
        />
      </Box>

      {/* New drawing dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Drawing</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Drawing Name"
            fullWidth
            value={newDrawingName}
            onChange={(e) => setNewDrawingName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={addDrawing}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* ─── TOOLBAR ──────────────────────────────────────────────────── */}
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
          <Tooltip title="Cable"><Button onClick={addCable}><CableIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Structural */}
        <CategoryLabel>Structural</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Column"><Button onClick={addColumn}><ColumnIcon /></Button></Tooltip>
          <Tooltip title="Beam"><Button onClick={addBeam}><BeamIcon /></Button></Tooltip>
          <Tooltip title="Wall"><Button onClick={addWall}><WallIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Floor & Foundation */}
        <CategoryLabel>Floor / Found.</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Slab"><Button onClick={addFloorSlab}><SlabIcon /></Button></Tooltip>
          <Tooltip title="Strip"><Button onClick={addStripFooting}><FootingIcon /></Button></Tooltip>
          <Tooltip title="Raft"><Button onClick={addRaftFoundation}><RaftIcon /></Button></Tooltip>
          <Tooltip title="Pile"><Button onClick={addPileFoundation}><PileIcon /></Button></Tooltip>
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

        {/* Water Reticulation */}
        <CategoryLabel>Reticulation</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Valve"><Button onClick={addValve}><ValveIcon /></Button></Tooltip>
          <Tooltip title="Sprinkler"><Button onClick={addSprinkler}><SprinklerIcon /></Button></Tooltip>
          <Tooltip title="Hydrant"><Button onClick={addHydrant}><HydrantIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Fencing */}
        <CategoryLabel>Fencing</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Post"><Button onClick={addFencePost}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Fence"><Button onClick={addFenceLine}><FenceIcon /></Button></Tooltip>
          <Tooltip title="Gate"><Button onClick={addGate}><GateIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Bridges */}
        <CategoryLabel>Bridges</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Bridge"><Button onClick={addBridge}><BridgeIcon /></Button></Tooltip>
          <Tooltip title="Culvert"><Button onClick={addCulvert}><CulvertIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Evaluation & Water Table */}
        <CategoryLabel>Eval / WT</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Borehole"><Button onClick={addBorehole}><BoreholeIcon /></Button></Tooltip>
          <Tooltip title="Test Pit"><Button onClick={addTestPit}><TestPitIcon /></Button></Tooltip>
          <Tooltip title="Piezometer"><Button onClick={addPiezometer}><PiezometerIcon /></Button></Tooltip>
          <Tooltip title="GWT"><Button onClick={addGroundwaterLevel}><WaterTableIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Survey */}
        <CategoryLabel>Survey</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Contour"><Button onClick={addContour}><ContourIcon /></Button></Tooltip>
          <Tooltip title="Point"><Button onClick={addSurveyPoint}><PointIcon /></Button></Tooltip>
          <Tooltip title="North"><Button onClick={addNorthArrow}><NorthIcon /></Button></Tooltip>
          <Tooltip title="Scale"><Button onClick={addScaleBar}><ScaleIcon /></Button></Tooltip>
          <Tooltip title="Spot Elev."><Button onClick={addSpotElevation}><SpotElevationIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Annotations */}
        <CategoryLabel>Annotations</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Grid"><Button onClick={addGridLine}><GridIcon /></Button></Tooltip>
          <Tooltip title="Dim"><Button onClick={addDimension}><DimIcon /></Button></Tooltip>
          <Tooltip title="Hatch"><Button onClick={addHatch}><HatchIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* CCTV */}
        <CategoryLabel>CCTV</CategoryLabel>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Camera"><Button onClick={addCamera}><CameraIcon /></Button></Tooltip>
          <Tooltip title="Monitor"><Button onClick={addCCTVMonitor}><MonitorIcon /></Button></Tooltip>
        </ButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Actions */}
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Delete"><Button onClick={deleteSelected}><DeleteIcon /></Button></Tooltip>
          <Tooltip title="Clear"><Button onClick={clearCanvas}><ClearIcon /></Button></Tooltip>
          <Tooltip title="Undo"><Button onClick={undo} disabled={!currentDrawing || currentDrawing.historyIndex <= 0}><UndoIcon /></Button></Tooltip>
          <Tooltip title="Redo"><Button onClick={redo} disabled={!currentDrawing || currentDrawing.historyIndex >= (currentDrawing.history?.length || 0) - 1}><RedoIcon /></Button></Tooltip>
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
        <canvas ref={canvasRef} width={1200} height={800} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>

      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {canvasReady ? '✅ Canvas ready – use tools above' : '⏳ Loading canvas...'}
      </Typography>
    </Box>
  );
};

export default DrawingForm;