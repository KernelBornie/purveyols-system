/**
 * PURVEYOLS AI Engine Service
 * Rule-based + algorithmic intelligence for construction analytics.
 */

// ---------------------------------------------------------------------------
// Shared constants / lookup tables
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86400000;
const DEFAULT_TERRAIN_RISK_SCORE = 5;

const PROJECT_TYPE_FACTORS = {
  residential: 1.0,
  commercial: 1.35,
  industrial: 1.5,
  infrastructure: 1.6,
  road: 1.4,
  bridge: 1.8,
  default: 1.2,
};

const LOCATION_FACTORS = {
  urban: 1.15,
  suburban: 1.0,
  rural: 0.9,
  remote: 0.8,
  default: 1.0,
};

const TERRAIN_FACTORS = {
  flat: 1.0,
  sloped: 1.1,
  hilly: 1.25,
  mountainous: 1.4,
  default: 1.0,
};

const STANDARD_BOQ_TEMPLATES = {
  residential: [
    { description: 'Site Clearing & Grubbing', unit: 'm²', unitRate: 15 },
    { description: 'Excavation for Foundations', unit: 'm³', unitRate: 120 },
    { description: 'Concrete (Foundations)', unit: 'm³', unitRate: 850 },
    { description: 'Concrete (Slab)', unit: 'm³', unitRate: 920 },
    { description: 'Masonry Blockwork', unit: 'm²', unitRate: 380 },
    { description: 'Roofing (IBR Sheets)', unit: 'm²', unitRate: 450 },
    { description: 'Plastering (Internal)', unit: 'm²', unitRate: 95 },
    { description: 'Painting (Internal & External)', unit: 'm²', unitRate: 65 },
    { description: 'Doors & Frames', unit: 'No', unitRate: 2800 },
    { description: 'Windows & Frames', unit: 'No', unitRate: 1800 },
    { description: 'Electrical Installations', unit: 'Sum', unitRate: 45000 },
    { description: 'Plumbing Installations', unit: 'Sum', unitRate: 38000 },
  ],
  commercial: [
    { description: 'Site Clearing & Grubbing', unit: 'm²', unitRate: 20 },
    { description: 'Excavation for Foundations', unit: 'm³', unitRate: 140 },
    { description: 'Reinforced Concrete (Foundations)', unit: 'm³', unitRate: 1100 },
    { description: 'Reinforced Concrete (Columns)', unit: 'm³', unitRate: 1400 },
    { description: 'Reinforced Concrete (Beams & Slabs)', unit: 'm³', unitRate: 1250 },
    { description: 'Masonry / Curtain Wall', unit: 'm²', unitRate: 550 },
    { description: 'Roofing System', unit: 'm²', unitRate: 680 },
    { description: 'Aluminium Glazing / Façade', unit: 'm²', unitRate: 950 },
    { description: 'Electrical Installations', unit: 'Sum', unitRate: 180000 },
    { description: 'HVAC System', unit: 'Sum', unitRate: 250000 },
    { description: 'Plumbing & Fire Fighting', unit: 'Sum', unitRate: 120000 },
    { description: 'Lifts / Elevators', unit: 'No', unitRate: 350000 },
  ],
  infrastructure: [
    { description: 'Site Preparation & Clearing', unit: 'm²', unitRate: 25 },
    { description: 'Bulk Earthworks', unit: 'm³', unitRate: 95 },
    { description: 'Sub-base Material (150mm)', unit: 'm²', unitRate: 185 },
    { description: 'Base Course (150mm)', unit: 'm²', unitRate: 240 },
    { description: 'Asphalt Surfacing (50mm)', unit: 'm²', unitRate: 310 },
    { description: 'Kerbing & Channelling', unit: 'm', unitRate: 180 },
    { description: 'Stormwater Drainage', unit: 'm', unitRate: 420 },
    { description: 'Road Markings', unit: 'm²', unitRate: 55 },
    { description: 'Traffic Signs & Furniture', unit: 'Sum', unitRate: 85000 },
  ],
  road: [
    { description: 'Clearing & Grubbing', unit: 'km', unitRate: 28000 },
    { description: 'Bulk Earthworks', unit: 'm³', unitRate: 88 },
    { description: 'Sub-grade Preparation', unit: 'm²', unitRate: 45 },
    { description: 'Sub-base (200mm Gravel)', unit: 'm²', unitRate: 195 },
    { description: 'Road Base (150mm Crushed Stone)', unit: 'm²', unitRate: 265 },
    { description: 'Asphalt Wearing Course (50mm)', unit: 'm²', unitRate: 340 },
    { description: 'Culverts (900mm dia)', unit: 'm', unitRate: 1850 },
    { description: 'Guardrails', unit: 'm', unitRate: 950 },
    { description: 'Road Markings & Signage', unit: 'Sum', unitRate: 120000 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFactor(table, key) {
  if (!key) return table.default;
  return table[key.toLowerCase()] || table.default;
}

function calculateConfidence({ hasArea, hasProjectType, hasTerrain, hasLocation }) {
  let score = 0.5;
  if (hasArea) score += 0.2;
  if (hasProjectType) score += 0.15;
  if (hasTerrain) score += 0.1;
  if (hasLocation) score += 0.05;
  return Math.min(score, 0.99);
}

// ---------------------------------------------------------------------------
// BOQ Generation
// ---------------------------------------------------------------------------

function generateBOQ({ projectType = 'residential', area = 100, terrain = 'flat', location = 'urban' }) {
  const template = STANDARD_BOQ_TEMPLATES[projectType] || STANDARD_BOQ_TEMPLATES.residential;
  const terrainF = getFactor(TERRAIN_FACTORS, terrain);
  const locationF = getFactor(LOCATION_FACTORS, location);

  const items = template.map((tpl) => {
    // Derive a sensible quantity from floor area or use 1 for lump sums
    let quantity = tpl.unit === 'Sum' || tpl.unit === 'No' ? 1 : Math.max(1, Math.round(area * 0.85));
    if (tpl.unit === 'm³') quantity = Math.max(1, Math.round(area * 0.12));
    if (tpl.unit === 'm') quantity = Math.max(1, Math.round(area * 0.4));
    if (tpl.unit === 'km') quantity = Math.max(1, Math.round(area / 1000));
    if (tpl.unit === 'No') quantity = Math.max(1, Math.round(area / 50));

    const adjustedRate = Math.round(tpl.unitRate * terrainF * locationF);
    return {
      description: tpl.description,
      unit: tpl.unit,
      quantity,
      unitRate: adjustedRate,
      amount: quantity * adjustedRate,
    };
  });

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return { items, totalAmount, projectType, confidence: calculateConfidence({ hasArea: !!area, hasProjectType: !!projectType, hasTerrain: !!terrain, hasLocation: !!location }) };
}

// ---------------------------------------------------------------------------
// Cost Prediction Engine
// ---------------------------------------------------------------------------

function predictCost({ boqTotalAmount, projectType = 'default', location = 'urban', contingencyRate = 0.1 }) {
  const typeFactor = getFactor(PROJECT_TYPE_FACTORS, projectType);
  const locationFactor = getFactor(LOCATION_FACTORS, location);

  const baseEstimate = boqTotalAmount * typeFactor * locationFactor;
  const contingency = baseEstimate * contingencyRate;
  const minEstimate = Math.round(baseEstimate * 0.85);
  const maxEstimate = Math.round(baseEstimate * 1.25);
  const recommended = Math.round(baseEstimate + contingency);

  let budgetRisk = 'low';
  if (contingency / baseEstimate > 0.2) budgetRisk = 'high';
  else if (contingency / baseEstimate > 0.12) budgetRisk = 'medium';

  return {
    baseEstimate: Math.round(baseEstimate),
    contingency: Math.round(contingency),
    minEstimate,
    maxEstimate,
    recommendedBudget: recommended,
    budgetRisk,
    currency: 'ZMW',
  };
}

// ---------------------------------------------------------------------------
// Risk Scoring Engine
// ---------------------------------------------------------------------------

function analyzeRisk({ projectType = 'residential', budget = 0, estimatedCost = 0, terrain = 'flat', location = 'urban', daysRemaining = 90, teamSize = 5, pendingApprovals = 0 }) {
  let score = 0;
  const alerts = [];

  // Budget risk (0–30 pts)
  if (estimatedCost > 0 && budget > 0) {
    const overrun = (estimatedCost - budget) / budget;
    if (overrun > 0.25) { score += 30; alerts.push({ category: 'Budget', message: `Estimated cost exceeds budget by ${Math.round(overrun * 100)}%`, severity: 'critical' }); }
    else if (overrun > 0.1) { score += 18; alerts.push({ category: 'Budget', message: `Cost estimate is ${Math.round(overrun * 100)}% above budget`, severity: 'high' }); }
    else if (overrun > 0) { score += 8; alerts.push({ category: 'Budget', message: 'Minor budget variance detected', severity: 'medium' }); }
  } else if (budget === 0) {
    score += 10; alerts.push({ category: 'Budget', message: 'No budget defined for project', severity: 'medium' });
  }

  // Terrain risk (0–20 pts)
  const terrainScores = { flat: 0, sloped: 8, hilly: 14, mountainous: 20 };
  const terrainScore = terrainScores[terrain] ?? 5;
  score += terrainScore;
  if (terrainScore >= 14) alerts.push({ category: 'Terrain', message: `${terrain} terrain increases structural risk`, severity: terrainScore >= 20 ? 'high' : 'medium' });

  // Timeline risk (0–20 pts)
  if (daysRemaining < 14) { score += 20; alerts.push({ category: 'Timeline', message: 'Project deadline is critically close', severity: 'critical' }); }
  else if (daysRemaining < 30) { score += 12; alerts.push({ category: 'Timeline', message: 'Project deadline approaching rapidly', severity: 'high' }); }
  else if (daysRemaining < 60) { score += 5; alerts.push({ category: 'Timeline', message: 'Monitor timeline closely', severity: 'low' }); }

  // Logistics risk (0–15 pts)
  const locationLogisticsScores = { urban: 0, suburban: 3, rural: 8, remote: 15 };
  const logisticsScore = locationLogisticsScores[location] ?? 5;
  score += logisticsScore;
  if (logisticsScore >= 8) alerts.push({ category: 'Logistics', message: `${location} location may impact material delivery and workforce`, severity: logisticsScore >= 15 ? 'high' : 'medium' });

  // Team size risk (0–10 pts)
  if (teamSize < 3) { score += 10; alerts.push({ category: 'Workforce', message: 'Insufficient team size for project delivery', severity: 'high' }); }
  else if (teamSize < 6) { score += 4; }

  // Pending approvals (0–5 pts)
  if (pendingApprovals > 5) { score += 5; alerts.push({ category: 'Administration', message: `${pendingApprovals} approvals still pending`, severity: 'medium' }); }
  else if (pendingApprovals > 2) { score += 2; }

  score = Math.min(score, 100);

  let riskLevel = 'low';
  if (score >= 75) riskLevel = 'critical';
  else if (score >= 50) riskLevel = 'high';
  else if (score >= 25) riskLevel = 'medium';

  return { riskScore: score, riskLevel, alerts };
}

// ---------------------------------------------------------------------------
// Progress Estimation Engine
// ---------------------------------------------------------------------------

function estimateProgress({ startDate, endDate, currentDate, completedTasks = 0, totalTasks = 10, budgetSpent = 0, budgetTotal = 1 }) {
  const now = currentDate ? new Date(currentDate) : new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  let timeProgress = 0;
  let daysRemaining = null;
  let daysElapsed = 0;

  if (start && end) {
    const totalMs = end - start;
    const elapsedMs = now - start;
    timeProgress = Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));
    daysElapsed = Math.max(0, Math.round(elapsedMs / 86400000));
    daysRemaining = Math.max(0, Math.round((end - now) / 86400000));
  }

  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetProgress = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;

  // Combined progress (weighted)
  const overallProgress = Math.round(taskProgress * 0.5 + timeProgress * 0.3 + budgetProgress * 0.2);

  // Delay prediction
  let delayRisk = 'on-track';
  let delayDays = 0;
  if (timeProgress > taskProgress + 15) {
    delayRisk = 'delayed';
    delayDays = Math.round((timeProgress - taskProgress) * (daysRemaining || 30) / 100);
  } else if (timeProgress > taskProgress + 5) {
    delayRisk = 'at-risk';
    delayDays = Math.round((timeProgress - taskProgress) * (daysRemaining || 30) / 200);
  }

  // Workforce efficiency (task completion vs time spent)
  const efficiency = timeProgress > 0 ? Math.round((taskProgress / timeProgress) * 100) : 100;

  return {
    overallProgress,
    taskProgress,
    timeProgress,
    budgetProgress,
    daysElapsed,
    daysRemaining,
    delayRisk,
    delayDays,
    workforceEfficiency: Math.min(efficiency, 200),
  };
}

// ---------------------------------------------------------------------------
// Unified Site Analysis
// ---------------------------------------------------------------------------

function analyzeSite({ projectType, area, terrain, location, budget, estimatedCost, startDate, endDate, teamSize = 5, pendingApprovals = 0 }) {
  const boqResult = generateBOQ({ projectType, area, terrain, location });
  const costResult = predictCost({
    boqTotalAmount: estimatedCost || boqResult.totalAmount,
    projectType,
    location,
  });
  const riskResult = analyzeRisk({
    projectType,
    budget: budget || 0,
    estimatedCost: costResult.recommendedBudget,
    terrain,
    location,
    daysRemaining: startDate && endDate ? Math.max(0, Math.round((new Date(endDate) - new Date()) / 86400000)) : 90,
    teamSize,
    pendingApprovals,
  });
  const progressResult = estimateProgress({ startDate, endDate });

  return {
    boq: boqResult,
    costEstimate: costResult,
    riskScore: riskResult,
    progressEstimate: progressResult,
    confidence: boqResult.confidence,
  };
}

module.exports = { analyzeSite, generateBOQ, predictCost, analyzeRisk, estimateProgress };
