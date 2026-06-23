import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
  Box, Button, ButtonGroup, Typography, Alert, CircularProgress,
  Paper, Divider, Tooltip, Tabs, Tab, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  // ... all other icons you already have
} from '@mui/icons-material';

// ... (keep all the existing tool functions and imports, they are unchanged)

const DrawingForm = () => {
  // --- Multi-drawing state ---
  const [drawings, setDrawings] = useState([
    { id: '1', name: 'Drawing 1', data: null },
  ]);
  const [activeId, setActiveId] = useState('1');
  const [openDialog, setOpenDialog] = useState(false);
  const [newDrawingName, setNewDrawingName] = useState('');

  // --- Canvas refs (same as before) ---
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // --- Other state (loading, error, history) ---
  // ... (keep existing state variables)

  // --- Initialisation (now uses activeId) ---
  useEffect(() => {
    // When activeId changes, we need to re-init the canvas with that drawing's data.
    // However, we also need to save the current drawing before switching.
    // We'll handle switching in a separate effect that watches activeId.
    // For now, init the first drawing on mount.
    if (!canvasRef.current) return;
    initCanvas(activeId);
  }, [activeId]);

  // Function to save current canvas data to drawings state
  const saveCurrentDrawing = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const json = fc.toJSON();
    setDrawings(prev =>
      prev.map(d =>
        d.id === activeId ? { ...d, data: json } : d
      )
    );
  };

  // Function to load a drawing by id
  const loadDrawing = (id) => {
    const drawing = drawings.find(d => d.id === id);
    if (!drawing) return;
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    if (drawing.data) {
      fc.loadFromJSON(drawing.data, () => fc.renderAll());
    } else {
      // Clear canvas and draw grid
      fc.clear();
      drawGrid(fc);
      fc.renderAll();
    }
  };

  // Helper to draw grid (extracted)
  const drawGrid = (fc) => {
    const gs = 10;
    for (let i = 0; i < 1200; i += gs) {
      fc.add(new fabric.Line([i, 0, i, 800], { stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true }));
    }
    for (let i = 0; i < 800; i += gs) {
      fc.add(new fabric.Line([0, i, 1200, i], { stroke: '#e8e8e8', selectable: false, evented: false, excludeFromExport: true }));
    }
  };

  const initCanvas = (id) => {
    const fc = new fabric.Canvas(canvasRef.current, {
      width: 1200, height: 800,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });
    fabricCanvasRef.current = fc;
    drawGrid(fc);
    // Load drawing data if any
    const drawing = drawings.find(d => d.id === id);
    if (drawing && drawing.data) {
      fc.loadFromJSON(drawing.data, () => fc.renderAll());
    } else {
      fc.renderAll();
    }
    // Set up history events (same as before)
    // ... (bind saveHistory to object:added, modified, removed)
  };

  // --- Switch drawing ---
  const switchDrawing = (id) => {
    // Save current
    saveCurrentDrawing();
    // Change active
    setActiveId(id);
    // Load new (will be triggered by useEffect)
  };

  // --- Add new drawing ---
  const addDrawing = () => {
    const newId = Date.now().toString();
    const newDrawing = { id: newId, name: newDrawingName || `Drawing ${drawings.length + 1}`, data: null };
    setDrawings([...drawings, newDrawing]);
    setActiveId(newId);
    setOpenDialog(false);
    setNewDrawingName('');
  };

  // --- Delete drawing ---
  const deleteDrawing = (id) => {
    if (drawings.length <= 1) return alert('Cannot delete the last drawing.');
    if (window.confirm('Delete this drawing?')) {
      setDrawings(drawings.filter(d => d.id !== id));
      if (id === activeId) {
        setActiveId(drawings[0].id);
      }
    }
  };

  // --- Save all to localStorage (or backend) ---
  const saveAllDrawings = () => {
    saveCurrentDrawing(); // ensure latest
    localStorage.setItem('drawings', JSON.stringify(drawings));
    alert('All drawings saved.');
  };

  const loadAllDrawings = () => {
    const saved = localStorage.getItem('drawings');
    if (!saved) return alert('No saved drawings.');
    const parsed = JSON.parse(saved);
    setDrawings(parsed);
    setActiveId(parsed[0]?.id || '1');
  };

  // --- Render toolbar with tabs ---
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>🏗️ Professional Construction Drawing Suite</Typography>

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
              icon={<IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteDrawing(d.id); }}><DeleteIcon fontSize="small" /></IconButton>}
              iconPosition="end"
            />
          ))}
        </Tabs>
        <Button startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          New
        </Button>
        <Button startIcon={<SaveIcon />} onClick={saveAllDrawings}>Save All</Button>
        <Button startIcon={<LoadIcon />} onClick={loadAllDrawings}>Load All</Button>
      </Box>

      {/* Dialog for new drawing name */}
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

      {/* Rest of the toolbar (all the tool buttons) – unchanged */}
      {/* ... */}

      {/* Canvas container – unchanged */}
      <Box sx={{ border: '2px solid #ccc', borderRadius: 2, overflow: 'auto', width: '100%', minHeight: '800px', bgcolor: '#fafafa', position: 'relative' }}>
        <canvas ref={canvasRef} width={1200} height={800} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>
    </Box>
  );
};

export default DrawingForm;
