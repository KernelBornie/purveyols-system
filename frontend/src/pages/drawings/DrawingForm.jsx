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

  // ─── PROFESSIONAL TOOLS (shortened for brevity – keep all existing tools) ──
  // All tool functions remain unchanged; only print function is added.
  // ... (all existing add* functions remain the same) ...

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