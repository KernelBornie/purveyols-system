import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import {
  Box, Paper, ButtonGroup, Button, Tooltip, Divider,
  Typography, CircularProgress, Alert, Switch, FormControlLabel
} from '@mui/material';
// ... (all imports remain the same as before)

// ... (keep all the icon imports and CategoryLabel)

const DrawingCanvas = forwardRef(({ initialData, onChange, height = 600, width = 900, scale = 100 }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);

  // ─── Expose methods ──────────────────────────────────────────────────
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
    // NEW: get polygon data from canvas
    getPolygonData: () => {
      const fc = fabricCanvasRef.current;
      if (!fc) return null;
      const objects = fc.getObjects();
      // Find the first polygon or rect (exclude grid)
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
      let area = 0;
      let perimeter = 0;
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

  // ... (rest of the component – all tool functions and render remain exactly as you have them)
  // Ensure the toolbar still includes all tools.
});
