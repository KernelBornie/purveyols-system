import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';  // ✅ Correct import for v5

// MUI components – you can replace with your own UI library
import {
  Box,
  Button,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  CircularProgress,
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
} from '@mui/icons-material';

const DrawingForm = () => {
  // --- Refs ---
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // --- State ---
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(true);
  const [canvasError, setCanvasError] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- Initialize Fabric Canvas ---
  useEffect(() => {
    if (!canvasRef.current) return;

    let fc;

    try {
      setCanvasLoading(true);
      setCanvasError(null);

      fc = new fabric.Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: '#f5f5f5',
        preserveObjectStacking: true,
        selection: true,
      });

      fabricCanvasRef.current = fc;

      // --- Draw grid ---
      const gridSize = 20;
      for (let i = 0; i < 900; i += gridSize) {
        fc.add(
          new fabric.Line([i, 0, i, 600], {
            stroke: '#e0e0e0',
            selectable: false,
            evented: false,
            excludeFromExport: true,
          })
        );
      }
      for (let i = 0; i < 600; i += gridSize) {
        fc.add(
          new fabric.Line([0, i, 900, i], {
            stroke: '#e0e0e0',
            selectable: false,
            evented: false,
            excludeFromExport: true,
          })
        );
      }
      fc.renderAll();

      // --- Restore saved drawing (if any) ---
      // If you have saved JSON, load it here
      // const saved = localStorage.getItem('drawing');
      // if (saved) fc.loadFromJSON(JSON.parse(saved), () => fc.renderAll());

      // --- Save history on every modification ---
      fc.on('object:added', saveHistory);
      fc.on('object:modified', saveHistory);
      fc.on('object:removed', saveHistory);

      setCanvasReady(true);
      setCanvasLoading(false);
    } catch (err) {
      console.error('Canvas init error:', err);
      setCanvasError(err.message);
      setCanvasLoading(false);
      setCanvasReady(false);
    }

    // --- Cleanup ---
    return () => {
      if (fc) {
        fc.off('object:added', saveHistory);
        fc.off('object:modified', saveHistory);
        fc.off('object:removed', saveHistory);
        fc.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // --- History helpers ---
  const saveHistory = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const json = fc.toJSON();
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const newIndex = historyIndex - 1;
    fc.loadFromJSON(history[newIndex], () => fc.renderAll());
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const newIndex = historyIndex + 1;
    fc.loadFromJSON(history[newIndex], () => fc.renderAll());
    setHistoryIndex(newIndex);
  };

  // --- Tool functions ---
  const getCanvas = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) {
      console.warn('Canvas not ready');
      return null;
    }
    return fc;
  };

  const addRectangle = () => {
    const fc = getCanvas();
    if (!fc) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 120,
      height: 80,
      fill: 'rgba(0,123,255,0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
    });
    fc.add(rect);
    fc.setActiveObject(rect);
    fc.renderAll();
  };

  const addCircle = () => {
    const fc = getCanvas();
    if (!fc) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 50,
      fill: 'rgba(255,0,0,0.2)',
      stroke: '#dc3545',
      strokeWidth: 2,
    });
    fc.add(circle);
    fc.renderAll();
  };

  const addLine = () => {
    const fc = getCanvas();
    if (!fc) return;
    const line = new fabric.Line([50, 50, 300, 300], {
      stroke: '#000',
      strokeWidth: 3,
    });
    fc.add(line);
    fc.renderAll();
  };

  const addText = () => {
    const fc = getCanvas();
    if (!fc) return;
    const text = new fabric.Textbox('Edit me', {
      left: 200,
      top: 200,
      width: 200,
      fontSize: 20,
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
    const gridSize = 20;
    for (let i = 0; i < 900; i += gridSize) {
      fc.add(
        new fabric.Line([i, 0, i, 600], {
          stroke: '#e0e0e0',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
    for (let i = 0; i < 600; i += gridSize) {
      fc.add(
        new fabric.Line([0, i, 900, i], {
          stroke: '#e0e0e0',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
      );
    }
    fc.renderAll();
  };

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
    if (!saved) {
      alert('No saved drawing found');
      return;
    }
    fc.loadFromJSON(JSON.parse(saved), () => fc.renderAll());
  };

  // --- Render ---
  if (canvasError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Canvas error: {canvasError}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Drawing Editor
      </Typography>

      {/* Toolbar */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <ButtonGroup variant="outlined" size="small">
          <Button onClick={addRectangle} startIcon={<RectIcon />}>
            Rect
          </Button>
          <Button onClick={addCircle} startIcon={<CircleIcon />}>
            Circle
          </Button>
          <Button onClick={addLine} startIcon={<LineIcon />}>
            Line
          </Button>
          <Button onClick={addText} startIcon={<TextIcon />}>
            Text
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" size="small">
          <Button
            onClick={toggleFreehand}
            startIcon={<PenIcon />}
            color={activeTool === 'pen' ? 'primary' : 'inherit'}
          >
            Pen
          </Button>
          <Button onClick={deleteSelected} startIcon={<DeleteIcon />}>
            Delete
          </Button>
          <Button onClick={clearCanvas} startIcon={<ClearIcon />}>
            Clear
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" size="small">
          <Button onClick={undo} startIcon={<UndoIcon />} disabled={historyIndex <= 0}>
            Undo
          </Button>
          <Button
            onClick={redo}
            startIcon={<RedoIcon />}
            disabled={historyIndex >= history.length - 1}
          >
            Redo
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" size="small">
          <Button onClick={saveDrawing} startIcon={<SaveIcon />}>
            Save
          </Button>
          <Button onClick={loadDrawing} startIcon={<LoadIcon />}>
            Load
          </Button>
        </ButtonGroup>
      </Box>

      {/* Canvas container */}
      <Box
        sx={{
          border: '2px solid #ccc',
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
          minHeight: '600px',
          bgcolor: '#fafafa',
          position: 'relative',
        }}
      >
        {canvasLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </Box>

      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {canvasReady ? '✅ Canvas ready' : '⏳ Loading canvas...'}
      </Typography>
    </Box>
  );
};

export default DrawingForm;
