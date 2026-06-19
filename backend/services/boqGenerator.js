const BOQ = require('../models/BOQ');
const BOQItem = require('../models/BOQItem'); // assuming you have a BOQItem model

// This function will be called from the route
async function generateBOQFromDrawing(drawing) {
  const items = [];
  let grandTotal = 0;

  // ─── Fence Plan ──────────────────────────────────────
  if (drawing.type === 'fence_plan') {
    // In a real system, you would parse the canvasData to extract fence length, etc.
    // For now, we'll assume some values from the drawing's metadata.
    const length = drawing.length || 100; // placeholder
    const postSpacing = 3;
    const posts = Math.floor(length / postSpacing) + 1;
    const wire = length * 1.1; // +10% waste
    const concrete = posts * 0.15; // m³ per post
    const cement = concrete * 6.5; // bags per m³

    items.push(
      { description: 'Fence posts', quantity: posts, unit: 'ea', rate: 25, total: posts * 25 },
      { description: 'Chain link wire', quantity: wire, unit: 'm', rate: 8, total: wire * 8 },
      { description: 'Concrete for posts', quantity: concrete, unit: 'm³', rate: 180, total: concrete * 180 },
      { description: 'Cement', quantity: cement, unit: 'bags', rate: 12, total: cement * 12 }
    );
  }

  // ─── Building Plan ──────────────────────────────────
  if (drawing.type === 'building_plan') {
    // Placeholder: extract area from canvasData
    const area = 120; // m²
    const wallArea = area * 3.5;
    const concreteVolume = area * 0.15;
    const steel = area * 80; // kg
    items.push(
      { description: 'Concrete', quantity: concreteVolume, unit: 'm³', rate: 180, total: concreteVolume * 180 },
      { description: 'Steel reinforcement', quantity: steel, unit: 'kg', rate: 2.5, total: steel * 2.5 },
      { description: 'Brickwork', quantity: wallArea, unit: 'm²', rate: 35, total: wallArea * 35 }
    );
  }

  // ─── Road Design ─────────────────────────────────────
  if (drawing.type === 'road_design') {
    const length = 200; // m
    const width = 7; // m
    const subbase = length * width * 0.2;
    const base = length * width * 0.15;
    const asphalt = length * width * 0.05;
    items.push(
      { description: 'Sub-base', quantity: subbase, unit: 'm³', rate: 45, total: subbase * 45 },
      { description: 'Base course', quantity: base, unit: 'm³', rate: 55, total: base * 55 },
      { description: 'Asphalt', quantity: asphalt, unit: 'm³', rate: 120, total: asphalt * 120 }
    );
  }

  // ─── Access Control ──────────────────────────────────
  if (drawing.type === 'access_control') {
    // Count elements from canvasData or from the layout
    const gates = 2;
    const biometrics = 4;
    const cctv = 8;
    items.push(
      { description: 'Sliding gate', quantity: gates, unit: 'ea', rate: 800, total: gates * 800 },
      { description: 'Biometric reader', quantity: biometrics, unit: 'ea', rate: 150, total: biometrics * 150 },
      { description: 'CCTV camera', quantity: cctv, unit: 'ea', rate: 200, total: cctv * 200 }
    );
  }

  // ─── Sum totals ──────────────────────────────────────
  grandTotal = items.reduce((sum, it) => sum + it.total, 0);

  // Create BOQ document (assuming you have a BOQ model)
  const boq = new BOQ({
    project: drawing.project,
    name: `Auto BOQ for ${drawing.name}`,
    items: items.map(it => ({
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      rate: it.rate,
      total: it.total,
    })),
    grandTotal,
    status: 'draft',
    createdBy: drawing.createdBy,
  });
  await boq.save();
  return boq;
}

module.exports = { generateBOQFromDrawing };
