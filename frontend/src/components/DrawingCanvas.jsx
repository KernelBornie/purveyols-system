// frontend/src/components/DrawingCanvas.jsx
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import {
  Box, Paper, ButtonGroup, Button, Tooltip, Divider, IconButton,
  Typography, CircularProgress, Alert
} from '@mui/material';
// ... import all icons and tool functions as in the final DrawingForm

const DrawingCanvas = forwardRef(({ initialData, onChange, height = 600, width = 900 }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Expose methods to parent (like save, load, clear)
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

  // Initialize Fabric
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

      // Draw grid
      drawGrid(fc);

      // Load initial data if provided
      if (initialData) {
        fc.loadFromJSON(initialData, () => fc.renderAll());
      } else {
        fc.renderAll();
      }

      // History
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

  // Grid helper
  const drawGrid = (fc) => {
    const gs = 10;
    for (let i = 0; i < width; i += gs) {
      fc.add(new fabric.Line([i, 0, i, height], {
        stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true
      }));
    }
    for (let i = 0; i < height; i += gs) {
      fc.add(new fabric.Line([0, i, width, i], {
        stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true
      }));
    }
  };

  // Tool functions (copy all from the final DrawingForm – addRectangle, addCircle, etc.)
  // ... (all the addCCTV, addFence, etc.)

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Toolbar - same as DrawingForm but without tabs */}
      <Paper sx={{ p: 1, mb: 2, overflowX: 'auto', whiteSpace: 'nowrap' }} elevation={2}>
        {/* All tool buttons (Rect, Circle, Line, Text, Pen, etc.) */}
        {/* ... include exactly as in DrawingForm */}
      </Paper>

      <Box sx={{ border: '2px solid #ccc', borderRadius: 2, overflow: 'auto', bgcolor: '#fafafa', position: 'relative' }}>
        {loading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />}
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>
    </Box>
  );
});

export default DrawingCanvas;
