import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Grid, TextField, Typography, Paper, Chip, Divider
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';

const conversionFactors = {
  // ─── AREA ──────────────────────────────────────────────────────────
  area: {
    m2_to_ft2: 10.7639,
    ft2_to_m2: 0.092903,
    m2_to_yd2: 1.19599,
    yd2_to_m2: 0.836127,
    ha_to_m2: 10000,
    m2_to_ha: 0.0001,
    acres_to_m2: 4046.86,
    m2_to_acres: 0.000247105,
    ft2_to_yd2: 0.111111,
    yd2_to_ft2: 9,
  },
  // ─── VOLUME ────────────────────────────────────────────────────────
  volume: {
    m3_to_yd3: 1.30795,
    yd3_to_m3: 0.764555,
    m3_to_ft3: 35.3147,
    ft3_to_m3: 0.0283168,
    litres_to_m3: 0.001,
    m3_to_litres: 1000,
    gallons_to_m3: 0.00378541,
    m3_to_gallons: 264.172,
    m3_to_boardfeet: 423.776,
    boardfeet_to_m3: 0.00235974,
  },
  // ─── LENGTH ────────────────────────────────────────────────────────
  length: {
    m_to_ft: 3.28084,
    ft_to_m: 0.3048,
    m_to_yd: 1.09361,
    yd_to_m: 0.9144,
    km_to_m: 1000,
    m_to_km: 0.001,
    miles_to_km: 1.60934,
    km_to_miles: 0.621371,
    mm_to_in: 0.0393701,
    in_to_mm: 25.4,
    m_to_in: 39.3701,
    in_to_m: 0.0254,
  },
  // ─── WEIGHT / MASS ──────────────────────────────────────────────────
  weight: {
    kg_to_ton: 0.001,
    ton_to_kg: 1000,
    kg_to_lbs: 2.20462,
    lbs_to_kg: 0.453592,
    ton_to_lbs: 2204.62,
    lbs_to_ton: 0.000453592,
    kg_to_stones: 0.157473,
    stones_to_kg: 6.35029,
    tonnes_to_kg: 1000,
    kg_to_tonnes: 0.001,
  },
  // ─── CONCRETE MIX ──────────────────────────────────────────────────
  concrete: {
    mixRatios: {
      'C15': { cement: 1, sand: 3, aggregate: 6 },
      'C20': { cement: 1, sand: 2, aggregate: 4 },
      'C25': { cement: 1, sand: 1.5, aggregate: 3 },
      'C30': { cement: 1, sand: 1, aggregate: 2 },
      'C35': { cement: 1, sand: 0.75, aggregate: 1.5 },
      'C40': { cement: 1, sand: 0.5, aggregate: 1 },
    },
    materialsPerM3: {
      cement: 300, // kg
      sand: 600,
      aggregate: 1200,
      water: 150,
    },
  },
  // ─── STEEL REINFORCEMENT ──────────────────────────────────────────
  steel: {
    barWeights: {
      6: 0.222,
      8: 0.395,
      10: 0.617,
      12: 0.888,
      14: 1.208,
      16: 1.579,
      18: 2.000,
      20: 2.466,
      22: 2.984,
      25: 3.854,
      28: 4.834,
      32: 6.313,
      36: 7.990,
      40: 9.864,
    },
    rebarSpacing: {
      100: 785,
      150: 523,
      200: 392,
      250: 314,
      300: 261,
      350: 224,
      400: 196,
    },
  },
  // ─── ROOFING ──────────────────────────────────────────────────────
  roofing: {
    pitchToSlope: {
      '5': 0.0875,
      '10': 0.1763,
      '15': 0.2679,
      '20': 0.3640,
      '25': 0.4663,
      '30': 0.5774,
      '35': 0.7002,
      '40': 0.8391,
      '45': 1.0000,
    },
    materialCoverage: {
      'Tiles': 12.5,
      'Corrugated Iron': 8.5,
      'Asphalt Shingles': 4.5,
      'Metal Roofing': 7.0,
      'Slate': 15.0,
    },
  },
  // ─── BRICKWORK ──────────────────────────────────────────────────────
  bricks: {
    bricksPerM2: {
      'half-brick (112mm)': 60,
      'one-brick (225mm)': 120,
      'one-and-half (337mm)': 180,
    },
    mortarPer1000: {
      cement: 0.3, // m³
      sand: 0.6,   // m³
    },
  },
  // ─── EXCAVATION ────────────────────────────────────────────────────
  excavation: {
    swellFactors: {
      'Rock': 1.5,
      'Clay': 1.3,
      'Sand': 1.2,
      'Gravel': 1.15,
      'Topsoil': 1.25,
    },
    shrinkageFactors: {
      'Fill': 0.85,
      'Compacted Fill': 0.75,
    },
  },
  // ─── PAINT ──────────────────────────────────────────────────────────
  paint: {
    coveragePerLitre: {
      'Smooth plaster': 12,
      'Rough plaster': 8,
      'Brick': 6,
      'Metal': 10,
      'Wood': 11,
      'Concrete': 9,
    },
    coatsRequired: {
      'Primer': 1,
      'Undercoat': 1,
      'Topcoat': 2,
    },
  },
  // ─── TIMBER / LUMBER ──────────────────────────────────────────────
  timber: {
    // Density of typical construction timber (kg/m³)
    density: 600, // average for pine
    // Board feet to m³: 1 board foot = 0.00235974 m³
    m3_to_boardfeet: 423.776,
    boardfeet_to_m3: 0.00235974,
    // Linear feet to meters
    ft_to_m: 0.3048,
    m_to_ft: 3.28084,
  },
  // ─── ASPHALT ──────────────────────────────────────────────────────
  asphalt: {
    density: 2200, // kg/m³ (approx)
    m3_to_tonnes: 2.2,
    tonnes_to_m3: 0.454545,
    // For a given thickness, m² to tonnes: area * thickness(m) * density
  },
  // ─── AGGREGATE ────────────────────────────────────────────────────
  aggregate: {
    density: 1600, // kg/m³ (approx)
    m3_to_tonnes: 1.6,
    tonnes_to_m3: 0.625,
  },
  // ─── SOIL ──────────────────────────────────────────────────────────
  soil: {
    density_kgm3_to_lbft3: 0.062428,
    density_lbft3_to_kgm3: 16.0185,
    // Moisture content conversion (optional)
  },
  // ─── SLOPE / GRADIENT ─────────────────────────────────────────────
  slope: {
    degrees_to_percent: (deg) => Math.tan(deg * Math.PI / 180) * 100,
    percent_to_degrees: (pct) => Math.atan(pct / 100) * 180 / Math.PI,
    degrees_to_ratio: (deg) => 1 / Math.tan(deg * Math.PI / 180),
    ratio_to_degrees: (ratio) => Math.atan(1 / ratio) * 180 / Math.PI,
  },
  // ─── PIPE ──────────────────────────────────────────────────────────
  pipe: {
    mm_to_in: 0.0393701,
    in_to_mm: 25.4,
    // Nominal pipe sizes (schedule 40 wall thickness)
    schedule40Wall: {
      '15': 2.77,
      '20': 2.87,
      '25': 3.38,
      '32': 3.56,
      '40': 3.68,
      '50': 3.91,
      '65': 4.78,
      '80': 5.49,
      '100': 6.02,
      '150': 7.11,
    },
  },
};

const ConversionTool = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState(null);

  // Concrete
  const [concreteMix, setConcreteMix] = useState('C20');
  const [concreteVolume, setConcreteVolume] = useState(1);

  // Steel
  const [steelDiameter, setSteelDiameter] = useState(12);
  const [steelLength, setSteelLength] = useState(1);
  const [rebarSpacing, setRebarSpacing] = useState(200);

  // Roofing
  const [roofPitch, setRoofPitch] = useState('30');
  const [roofArea, setRoofArea] = useState(100);
  const [roofMaterial, setRoofMaterial] = useState('Tiles');

  // Bricks
  const [wallArea, setWallArea] = useState(10);
  const [wallThickness, setWallThickness] = useState('half-brick (112mm)');

  // Excavation
  const [excavationVolume, setExcavationVolume] = useState(10);
  const [soilType, setSoilType] = useState('Clay');

  // Paint
  const [paintArea, setPaintArea] = useState(50);
  const [surfaceType, setSurfaceType] = useState('Smooth plaster');

  // Timber
  const [timberLength, setTimberLength] = useState(1);
  const [timberWidth, setTimberWidth] = useState(0.1);
  const [timberThickness, setTimberThickness] = useState(0.05);

  // Asphalt
  const [asphaltVolume, setAsphaltVolume] = useState(1);
  const [asphaltThickness, setAsphaltThickness] = useState(0.05); // m

  // Aggregate
  const [aggregateVolume, setAggregateVolume] = useState(1);

  // Soil density
  const [soilDensity, setSoilDensity] = useState(1600); // kg/m³

  // Slope
  const [slopeDegrees, setSlopeDegrees] = useState(30);

  // Pipe
  const [pipeDiameter, setPipeDiameter] = useState(50); // mm
  const [pipeLength, setPipeLength] = useState(1); // m

  // ─── Handle conversions ──────────────────────────────────────────
  const handleConvert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return;
    let converted = 0;
    const category = getCategory();
    const key = `${fromUnit}_to_${toUnit}`;
    const factor = conversionFactors[category]?.[key];
    if (factor) {
      converted = value * factor;
    } else {
      const reverseKey = `${toUnit}_to_${fromUnit}`;
      if (conversionFactors[category]?.[reverseKey]) {
        converted = value / conversionFactors[category][reverseKey];
      } else {
        setResult('Conversion not supported');
        return;
      }
    }
    setResult(converted);
  };

  const getCategory = () => {
    const map = {
      0: 'area',
      1: 'volume',
      2: 'length',
      3: 'weight',
      11: 'timber',
      12: 'asphalt',
      13: 'aggregate',
      14: 'soil',
      15: 'slope',
      16: 'pipe',
    };
    return map[tab] || 'area';
  };

  // ─── Render functions ────────────────────────────────────────────
  const renderConversionTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Unit Conversion</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField select label="From" fullWidth value={fromUnit} onChange={e => setFromUnit(e.target.value)} SelectProps={{ native: true }}>
            <option value="">Select</option>
            {Object.keys(conversionFactors[getCategory()] || {}).map(k => {
              const parts = k.split('_to_');
              if (parts.length === 2) return <option key={parts[0]} value={parts[0]}>{parts[0]}</option>;
              return null;
            })}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select label="To" fullWidth value={toUnit} onChange={e => setToUnit(e.target.value)} SelectProps={{ native: true }}>
            <option value="">Select</option>
            {Object.keys(conversionFactors[getCategory()] || {}).map(k => {
              const parts = k.split('_to_');
              if (parts.length === 2) return <option key={parts[1]} value={parts[1]}>{parts[1]}</option>;
              return null;
            })}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Value" type="number" fullWidth value={inputValue} onChange={e => setInputValue(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={handleConvert}>Convert</Button>
          {result !== null && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#e8f5e9' }}>
              <Typography variant="body1">
                {inputValue} {fromUnit} = {result} {toUnit}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Concrete Tab ──────────────────────────────────────────────────
  const renderConcreteTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Concrete Mix Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField select label="Concrete Grade" fullWidth value={concreteMix} onChange={e => setConcreteMix(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.concrete.mixRatios).map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Volume (m³)" type="number" fullWidth value={concreteVolume} onChange={e => setConcreteVolume(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Mix Ratio: {Object.entries(conversionFactors.concrete.mixRatios[concreteMix]).map(([k, v]) => <Chip key={k} label={`${k}: ${v}`} size="small" sx={{ ml: 1 }} />)}</Typography>
            <ul>
              <li>Cement: {(concreteVolume * conversionFactors.concrete.materialsPerM3.cement).toFixed(2)} kg</li>
              <li>Sand: {(concreteVolume * conversionFactors.concrete.materialsPerM3.sand).toFixed(2)} kg</li>
              <li>Aggregate: {(concreteVolume * conversionFactors.concrete.materialsPerM3.aggregate).toFixed(2)} kg</li>
              <li>Water: {(concreteVolume * conversionFactors.concrete.materialsPerM3.water).toFixed(2)} litres</li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Steel Tab ──────────────────────────────────────────────────────
  const renderSteelTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Steel Reinforcement Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField select label="Bar Diameter (mm)" fullWidth value={steelDiameter} onChange={e => setSteelDiameter(parseFloat(e.target.value))} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.steel.barWeights).map(d => <option key={d} value={d}>{d}mm</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Length (m)" type="number" fullWidth value={steelLength} onChange={e => setSteelLength(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select label="Spacing (mm)" fullWidth value={rebarSpacing} onChange={e => setRebarSpacing(parseFloat(e.target.value))} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.steel.rebarSpacing).map(s => <option key={s} value={s}>{s}mm</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Weight per meter: {conversionFactors.steel.barWeights[steelDiameter]} kg/m</Typography>
            <Typography variant="body2">Total weight: {(conversionFactors.steel.barWeights[steelDiameter] * steelLength).toFixed(2)} kg</Typography>
            <Typography variant="body2">Rebar area per meter width: {conversionFactors.steel.rebarSpacing[rebarSpacing]} mm²/m</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Roofing Tab ────────────────────────────────────────────────────
  const renderRoofingTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Roofing Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField select label="Roof Pitch (degrees)" fullWidth value={roofPitch} onChange={e => setRoofPitch(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.roofing.pitchToSlope).map(p => <option key={p} value={p}>{p}°</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Floor Area (m²)" type="number" fullWidth value={roofArea} onChange={e => setRoofArea(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select label="Roofing Material" fullWidth value={roofMaterial} onChange={e => setRoofMaterial(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.roofing.materialCoverage).map(m => <option key={m} value={m}>{m}</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Slope Factor: {conversionFactors.roofing.pitchToSlope[roofPitch]}</Typography>
            <Typography variant="body2">Actual Roof Area: {(roofArea * conversionFactors.roofing.pitchToSlope[roofPitch]).toFixed(2)} m²</Typography>
            <Typography variant="body2">Material Required: {((roofArea * conversionFactors.roofing.pitchToSlope[roofPitch]) / conversionFactors.roofing.materialCoverage[roofMaterial]).toFixed(2)} units</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Bricks Tab ────────────────────────────────────────────────────
  const renderBricksTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Brickwork Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Wall Area (m²)" type="number" fullWidth value={wallArea} onChange={e => setWallArea(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Wall Thickness" fullWidth value={wallThickness} onChange={e => setWallThickness(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.bricks.bricksPerM2).map(t => <option key={t} value={t}>{t}</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Bricks Required: {(wallArea * conversionFactors.bricks.bricksPerM2[wallThickness]).toFixed(0)}</Typography>
            <Typography variant="body2">Cement for mortar: {(wallArea * conversionFactors.bricks.bricksPerM2[wallThickness] / 1000 * conversionFactors.bricks.mortarPer1000.cement).toFixed(3)} m³</Typography>
            <Typography variant="body2">Sand for mortar: {(wallArea * conversionFactors.bricks.bricksPerM2[wallThickness] / 1000 * conversionFactors.bricks.mortarPer1000.sand).toFixed(3)} m³</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Excavation Tab ──────────────────────────────────────────────────
  const renderExcavationTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Excavation Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Excavation Volume (m³)" type="number" fullWidth value={excavationVolume} onChange={e => setExcavationVolume(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Soil Type" fullWidth value={soilType} onChange={e => setSoilType(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.excavation.swellFactors).map(s => <option key={s} value={s}>{s}</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Swell Factor: {conversionFactors.excavation.swellFactors[soilType]}</Typography>
            <Typography variant="body2">Loose Volume: {(excavationVolume * conversionFactors.excavation.swellFactors[soilType]).toFixed(2)} m³</Typography>
            <Typography variant="body2">Compacted Volume (at 85%): {(excavationVolume * 0.85).toFixed(2)} m³</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Paint Tab ──────────────────────────────────────────────────────
  const renderPaintTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Paint Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Surface Area (m²)" type="number" fullWidth value={paintArea} onChange={e => setPaintArea(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Surface Type" fullWidth value={surfaceType} onChange={e => setSurfaceType(e.target.value)} SelectProps={{ native: true }}>
            {Object.keys(conversionFactors.paint.coveragePerLitre).map(s => <option key={s} value={s}>{s}</option>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Coverage: {conversionFactors.paint.coveragePerLitre[surfaceType]} m²/L</Typography>
            <Typography variant="body2">Paint Required (1 coat): {(paintArea / conversionFactors.paint.coveragePerLitre[surfaceType]).toFixed(2)} L</Typography>
            <Typography variant="body2">Paint Required (2 coats): {(paintArea / conversionFactors.paint.coveragePerLitre[surfaceType] * 2).toFixed(2)} L</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Timber Tab ──────────────────────────────────────────────────────
  const renderTimberTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Timber / Lumber Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField label="Length (m)" type="number" fullWidth value={timberLength} onChange={e => setTimberLength(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Width (m)" type="number" fullWidth value={timberWidth} onChange={e => setTimberWidth(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Thickness (m)" type="number" fullWidth value={timberThickness} onChange={e => setTimberThickness(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Volume: {(timberLength * timberWidth * timberThickness).toFixed(4)} m³</Typography>
            <Typography variant="body2">Board Feet: {(timberLength * timberWidth * timberThickness * conversionFactors.timber.m3_to_boardfeet).toFixed(2)} bdft</Typography>
            <Typography variant="body2">Weight (approx): {((timberLength * timberWidth * timberThickness) * conversionFactors.timber.density).toFixed(2)} kg</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Asphalt Tab ──────────────────────────────────────────────────────
  const renderAsphaltTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Asphalt Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Volume (m³)" type="number" fullWidth value={asphaltVolume} onChange={e => setAsphaltVolume(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Thickness (m)" type="number" fullWidth value={asphaltThickness} onChange={e => setAsphaltThickness(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Weight: {(asphaltVolume * conversionFactors.asphalt.density / 1000).toFixed(2)} tonnes</Typography>
            <Typography variant="body2">Area coverage: {(asphaltVolume / asphaltThickness).toFixed(2)} m²</Typography>
            <Typography variant="body2">Asphalt required for 1m² at {asphaltThickness}m thickness: {(asphaltThickness * conversionFactors.asphalt.density / 1000).toFixed(3)} tonnes</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Aggregate Tab ──────────────────────────────────────────────────
  const renderAggregateTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Aggregate Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Volume (m³)" type="number" fullWidth value={aggregateVolume} onChange={e => setAggregateVolume(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Density (kg/m³)" type="number" fullWidth value={aggregateVolume} onChange={e => setAggregateVolume(parseFloat(e.target.value) || 0)} disabled />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Weight: {(aggregateVolume * conversionFactors.aggregate.density / 1000).toFixed(2)} tonnes</Typography>
            <Typography variant="body2">Volume from tonnes: {(aggregateVolume * conversionFactors.aggregate.tonnes_to_m3).toFixed(3)} m³</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Soil Density Tab ──────────────────────────────────────────────
  const renderSoilTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Soil Density Converter</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Density (kg/m³)" type="number" fullWidth value={soilDensity} onChange={e => setSoilDensity(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Density (lb/ft³)" type="number" fullWidth value={soilDensity * conversionFactors.soil.density_kgm3_to_lbft3} InputProps={{ readOnly: true }} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Conversions:</Typography>
            <ul>
              <li>{soilDensity} kg/m³ = {(soilDensity * conversionFactors.soil.density_kgm3_to_lbft3).toFixed(2)} lb/ft³</li>
              <li>{(soilDensity / conversionFactors.soil.density_kgm3_to_lbft3).toFixed(2)} kg/m³ = {soilDensity} lb/ft³</li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Slope Tab ──────────────────────────────────────────────────────
  const renderSlopeTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Slope / Gradient Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Degrees" type="number" fullWidth value={slopeDegrees} onChange={e => setSlopeDegrees(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Percentage (%)" type="number" fullWidth value={conversionFactors.slope.degrees_to_percent(slopeDegrees).toFixed(2)} InputProps={{ readOnly: true }} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Degree: {slopeDegrees}°</Typography>
            <Typography variant="body2">Percentage: {conversionFactors.slope.degrees_to_percent(slopeDegrees).toFixed(2)}%</Typography>
            <Typography variant="body2">Ratio (1:): {conversionFactors.slope.degrees_to_ratio(slopeDegrees).toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Pipe Tab ──────────────────────────────────────────────────────
  const renderPipeTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Pipe Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField label="Diameter (mm)" type="number" fullWidth value={pipeDiameter} onChange={e => setPipeDiameter(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Diameter (inches)" type="number" fullWidth value={pipeDiameter * conversionFactors.pipe.mm_to_in} InputProps={{ readOnly: true }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Length (m)" type="number" fullWidth value={pipeLength} onChange={e => setPipeLength(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Diameter: {pipeDiameter} mm = {(pipeDiameter * conversionFactors.pipe.mm_to_in).toFixed(2)} inches</Typography>
            <Typography variant="body2">Surface area: {(Math.PI * pipeDiameter / 1000 * pipeLength).toFixed(2)} m²</Typography>
            <Typography variant="body2">Volume: {(Math.PI * (pipeDiameter / 2000) ** 2 * pipeLength).toFixed(4)} m³</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ─── Render Tab Panel ──────────────────────────────────────────────
  const renderTabPanel = () => {
    switch (tab) {
      case 0: return renderConversionTab(); // Area
      case 1: return renderConversionTab(); // Volume
      case 2: return renderConversionTab(); // Length
      case 3: return renderConversionTab(); // Weight
      case 4: return renderConcreteTab();
      case 5: return renderSteelTab();
      case 6: return renderRoofingTab();
      case 7: return renderBricksTab();
      case 8: return renderExcavationTab();
      case 9: return renderPaintTab();
      case 10: return renderTimberTab();
      case 11: return renderAsphaltTab();
      case 12: return renderAggregateTab();
      case 13: return renderSoilTab();
      case 14: return renderSlopeTab();
      case 15: return renderPipeTab();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Construction Conversion Tool
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Area" />
          <Tab label="Volume" />
          <Tab label="Length" />
          <Tab label="Weight" />
          <Tab label="Concrete" />
          <Tab label="Steel" />
          <Tab label="Roofing" />
          <Tab label="Bricks" />
          <Tab label="Excavation" />
          <Tab label="Paint" />
          <Tab label="Timber" />
          <Tab label="Asphalt" />
          <Tab label="Aggregate" />
          <Tab label="Soil" />
          <Tab label="Slope" />
          <Tab label="Pipe" />
        </Tabs>
        <Box sx={{ mt: 2 }}>{renderTabPanel()}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversionTool;