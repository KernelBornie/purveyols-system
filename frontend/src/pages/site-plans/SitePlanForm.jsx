// Add inside component:
const drawingCanvasRef = useRef(null);
const [drawingScale, setDrawingScale] = useState(100);

const calculateAreaFromCanvas = () => {
  const polyData = drawingCanvasRef.current?.getPolygonData();
  if (polyData && polyData.points.length >= 3) {
    const factor = 0.01 * (100 / drawingScale);
    const areaM2 = polyData.area * factor * factor;
    const perimeterM = polyData.perimeter * factor;
    setForm(prev => ({ ...prev, area: areaM2, perimeter: perimeterM }));
    setMessage({ type: 'success', text: `Area: ${areaM2.toFixed(2)} m², Perimeter: ${perimeterM.toFixed(2)} m` });
  } else {
    setMessage({ type: 'warning', text: 'No polygon found on canvas. Draw a polygon or rectangle first.' });
  }
};

// In the Drawing tab:
<DrawingCanvas
  ref={drawingCanvasRef}
  initialData={form.drawingData ? JSON.parse(form.drawingData) : null}
  onChange={(json) => setForm(prev => ({ ...prev, drawingData: JSON.stringify(json) }))}
  height={600}
  width={900}
  scale={drawingScale}
/>
// And add a button:
<Button variant="outlined" onClick={calculateAreaFromCanvas} startIcon={<SaveIcon />}>Calc Area from Canvas</Button>
