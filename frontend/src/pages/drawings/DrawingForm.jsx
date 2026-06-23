// ... (same imports as before, plus RefreshIcon)

const DrawingForm = () => {
  // ... state variables

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) {
      setCanvasError('Canvas element not found. Please refresh.');
      setCanvasLoading(false);
      return false;
    }

    if (typeof fabric === 'undefined') {
      setCanvasError('Fabric library is not loaded. Check your dependencies.');
      setCanvasLoading(false);
      return false;
    }

    try {
      console.log('🖌️ Initializing fabric canvas...');
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: '#f5f5f5',
        selection: true,
        preserveObjectStacking: true,
      });

      // ... (grid, history, events as before)

      setCanvas(fabricCanvas);
      setCanvasReady(true);
      setCanvasError(null);
      setCanvasLoading(false);
      console.log('✅ Canvas ready');
      return true;
    } catch (err) {
      console.error('Canvas init error:', err);
      setCanvasError(err.message || 'Unknown error initializing canvas');
      setCanvasLoading(false);
      return false;
    }
  }, [form.drawingData, historyIndex, showGrid]);

  // ─── Deferred init ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      if (canvasRef.current) {
        initCanvas();
      } else {
        setCanvasError('Canvas not found. Try refreshing.');
        setCanvasLoading(false);
      }
    }, 200); // small delay to ensure DOM is ready

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [initCanvas]);

  // ... rest of the component
};
