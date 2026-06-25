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
      cement: 300,
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
    density: 600,
    m3_to_boardfeet: 423.776,
    boardfeet_to_m3: 0.00235974,
    ft_to_m: 0.3048,
    m_to_ft: 3.28084,
  },
  // ─── ASPHALT ──────────────────────────────────────────────────────
  asphalt: {
    density: 2200,
    m3_to_tonnes: 2.2,
    tonnes_to_m3: 0.454545,
  },
  // ─── AGGREGATE ────────────────────────────────────────────────────
  aggregate: {
    density: 1600,
    m3_to_tonnes: 1.6,
    tonnes_to_m3: 0.625,
  },
  // ─── SOIL ──────────────────────────────────────────────────────────
  soil: {
    density_kgm3_to_lbft3: 0.062428,
    density_lbft3_to_kgm3: 16.0185,
  },
  // ─── SLOPE ────────────────────────────────────────────────────────
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
  // ─── CEILING ──────────────────────────────────────────────────────
  ceiling: {
    tilesPerM2: {
      '600x600': 2.78,
      '600x1200': 1.39,
      '300x1200': 2.78,
      '2x2ft': 2.69,
      '2x4ft': 1.35,
    },
    boardWeights: {
      '9.5mm': 7.5,
      '12.5mm': 9.8,
      '15mm': 12.0,
    },
    gridPerM2: {
      main_tees: 0.7,
      cross_tees: 1.4,
      wall_angle: 0.3,
    },
  },
  // ─── ALUMINIUM ────────────────────────────────────────────────────
  aluminium: {
    density: 2700,
    profiles: {
      window_frame: 1.5,
      door_frame: 2.2,
      curtain_wall: 4.0,
      handrail: 3.5,
    },
  },
  // ─── DRYWALL ──────────────────────────────────────────────────────
  drywall: {
    boardWeights: {
      '9.5mm': 7.5,
      '12.5mm': 9.8,
      '15mm': 12.0,
    },
    screwsPerM2: 30,
    jointCompoundPerM2: 0.5,
    tapePerM2: 1.2,
  },
  // ─── TILING ────────────────────────────────────────────────────────
  tiling: {
    tileSizes: {
      '300x300': 11.11,
      '400x400': 6.25,
      '500x500': 4.00,
      '600x600': 2.78,
      '300x600': 5.56,
      '200x200': 25.00,
      '100x100': 100.00,
      '600x1200': 1.39,
    },
    adhesivePerM2: 4.0,
    groutPerM2: {
      '300x300': 0.3,
      '400x400': 0.25,
      '600x600': 0.2,
      '300x600': 0.28,
      '200x200': 0.35,
    },
  },
  // ─── CCTV ──────────────────────────────────────────────────────────
  cctv: {
    cableTypes: {
      'RG59': 0.08,
      'RG6': 0.1,
      'Cat5e': 0.04,
      'Cat6': 0.05,
    },
    cameraPower: {
      analog: 4,
      IP_bullet: 6,
      IP_dome: 8,
      PTZ: 25,
      thermal: 15,
    },
    storagePerCamera: {
      analog: 2,
      IP_720p: 4,
      IP_1080p: 8,
      IP_4K: 20,
    },
    cableLoss: {
      RG59: 6.5,
      RG6: 3.5,
      Cat5e: 2.0,
      Cat6: 1.5,
    },
  },
};

const ConversionTool = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState(null);

  // ─── Existing state variables ────────────────────────────────────
  const [concreteMix, setConcreteMix] = useState('C20');
  const [concreteVolume, setConcreteVolume] = useState(1);
  const [steelDiameter, setSteelDiameter] = useState(12);
  const [steelLength, setSteelLength] = useState(1);
  const [rebarSpacing, setRebarSpacing] = useState(200);
  const [roofPitch, setRoofPitch] = useState('30');
  const [roofArea, setRoofArea] = useState(100);
  const [roofMaterial, setRoofMaterial] = useState('Tiles');
  const [wallArea, setWallArea] = useState(10);
  const [wallThickness, setWallThickness] = useState('half-brick (112mm)');
  const [excavationVolume, setExcavationVolume] = useState(10);
  const [soilType, setSoilType] = useState('Clay');
  const [paintArea, setPaintArea] = useState(50);
  const [surfaceType, setSurfaceType] = useState('Smooth plaster');
  const [timberLength, setTimberLength] = useState(1);
  const [timberWidth, setTimberWidth] = useState(0.1);
  const [timberThickness, setTimberThickness] = useState(0.05);
  const [asphaltVolume, setAsphaltVolume] = useState(1);
  const [asphaltThickness, setAsphaltThickness] = useState(0.05);
  const [aggregateVolume, setAggregateVolume] = useState(1);
  const [soilDensity, setSoilDensity] = useState(1600);
  const [slopeDegrees, setSlopeDegrees] = useState(30);
  const [pipeDiameter, setPipeDiameter] = useState(50);
  const [pipeLength, setPipeLength] = useState(1);

  // ─── NEW: Ceiling ─────────────────────────────────────────────────
  const [ceilingTileSize, setCeilingTileSize] = useState('600x600');
  const [ceilingArea, setCeilingArea] = useState(50);
  const [ceilingBoardThickness, setCeilingBoardThickness] = useState('12.5mm');

  // ─── NEW: Aluminium ──────────────────────────────────────────────
  const [aluminiumProfile, setAluminiumProfile] = useState('window_frame');
  const [aluminiumLength, setAluminiumLength] = useState(10);

  // ─── NEW: Drywall ─────────────────────────────────────────────────
  const [drywallBoardThickness, setDrywallBoardThickness] = useState('12.5mm');
  const [drywallArea, setDrywallArea] = useState(20);

  // ─── NEW: Tiling ──────────────────────────────────────────────────
  const [tileSize, setTileSize] = useState('600x600');
  const [tileArea, setTileArea] = useState(30);
  const [tileWastage, setTileWastage] = useState(5);

  // ─── NEW: CCTV ────────────────────────────────────────────────────
  const [cctvCameraType, setCctvCameraType] = useState('IP_bullet');
  const [cctvCableType, setCctvCableType] = useState('Cat5e');
  const [cctvCableLength, setCctvCableLength] = useState(50);
  const [cctvCameras, setCctvCameras] = useState(4);
  const [cctvDays, setCctvDays] = useState(30);

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
      4: 'concrete',
      5: 'steel',
      6: 'roofing',
      7: 'bricks',
      8: 'excavation',
      9: 'paint',
      10: 'timber',
      11: 'asphalt',
      12: 'aggregate',
      13: 'soil',
      14: 'slope',
      15: 'pipe',
      16: 'ceiling',
      17: 'aluminium',
      18: 'drywall',
      19: 'tiling',
      20: 'cctv',
    };
    return map[tab] || 'area';
  };

  // ─── Render conversion tab ────────────────────────────────────────
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
  const renderConcreteTab = () => {
    const mix = conversionFactors.concrete.mixRatios[concreteMix] || { cement: 1, sand: 2, aggregate: 4 };
    const totalParts = mix.cement + mix.sand + mix.aggregate;
    const cement = (mix.cement / totalParts) * concreteVolume * conversionFactors.concrete.materialsPerM3.cement;
    const sand = (mix.sand / totalParts) * concreteVolume * conversionFactors.concrete.materialsPerM3.sand;
    const aggregate = (mix.aggregate / totalParts) * concreteVolume * conversionFactors.concrete.materialsPerM3.aggregate;
    const water = concreteVolume * conversionFactors.concrete.materialsPerM3.water;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Concrete Mix Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Mix Grade" fullWidth value={concreteMix} onChange={e => setConcreteMix(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.concrete.mixRatios).map(g => <option key={g} value={g}>{g}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Volume (m³)" type="number" fullWidth value={concreteVolume} onChange={e => setConcreteVolume(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Cement: {cement.toFixed(2)} kg</Typography>
              <Typography variant="body2">Sand: {sand.toFixed(2)} kg</Typography>
              <Typography variant="body2">Aggregate: {aggregate.toFixed(2)} kg</Typography>
              <Typography variant="body2">Water: {water.toFixed(2)} L</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Steel Tab ─────────────────────────────────────────────────────
  const renderSteelTab = () => {
    const weightPerM = conversionFactors.steel.barWeights[steelDiameter] || 0;
    const totalWeight = weightPerM * steelLength;
    const areaPerM2 = conversionFactors.steel.rebarSpacing[rebarSpacing] || 0;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Steel Reinforcement Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Diameter (mm)" fullWidth value={steelDiameter} onChange={e => setSteelDiameter(parseInt(e.target.value) || 12)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.steel.barWeights).map(d => <option key={d} value={d}>{d} mm</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Length (m)" type="number" fullWidth value={steelLength} onChange={e => setSteelLength(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Spacing (mm)" fullWidth value={rebarSpacing} onChange={e => setRebarSpacing(parseInt(e.target.value) || 200)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.steel.rebarSpacing).map(s => <option key={s} value={s}>{s} mm</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Weight per meter: {weightPerM.toFixed(3)} kg/m</Typography>
              <Typography variant="body2">Total weight: {totalWeight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Steel area per m²: {areaPerM2} mm²/m²</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Roofing Tab ──────────────────────────────────────────────────
  const renderRoofingTab = () => {
    const slopeFactor = conversionFactors.roofing.pitchToSlope[roofPitch] || 0.5774;
    const trueArea = roofArea * Math.sqrt(1 + slopeFactor * slopeFactor);
    const coverage = conversionFactors.roofing.materialCoverage[roofMaterial] || 8.5;
    const sheets = Math.ceil(trueArea / coverage);
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Roofing Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Pitch (°)" fullWidth value={roofPitch} onChange={e => setRoofPitch(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.roofing.pitchToSlope).map(p => <option key={p} value={p}>{p}°</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Floor Area (m²)" type="number" fullWidth value={roofArea} onChange={e => setRoofArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Material" fullWidth value={roofMaterial} onChange={e => setRoofMaterial(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.roofing.materialCoverage).map(m => <option key={m} value={m}>{m}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">True roof area: {trueArea.toFixed(2)} m²</Typography>
              <Typography variant="body2">Sheets needed: {sheets}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Bricks Tab ────────────────────────────────────────────────────
  const renderBricksTab = () => {
    const bricksPerM2 = conversionFactors.bricks.bricksPerM2[wallThickness] || 60;
    const totalBricks = Math.ceil(wallArea * bricksPerM2);
    const mortarCement = (totalBricks / 1000) * conversionFactors.bricks.mortarPer1000.cement;
    const mortarSand = (totalBricks / 1000) * conversionFactors.bricks.mortarPer1000.sand;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Brickwork Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Wall Thickness" fullWidth value={wallThickness} onChange={e => setWallThickness(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.bricks.bricksPerM2).map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Wall Area (m²)" type="number" fullWidth value={wallArea} onChange={e => setWallArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Bricks needed: {totalBricks}</Typography>
              <Typography variant="body2">Cement for mortar: {mortarCement.toFixed(2)} m³</Typography>
              <Typography variant="body2">Sand for mortar: {mortarSand.toFixed(2)} m³</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Excavation Tab ────────────────────────────────────────────────
  const renderExcavationTab = () => {
    const swell = conversionFactors.excavation.swellFactors[soilType] || 1.2;
    const shrink = conversionFactors.excavation.shrinkageFactors['Fill'] || 0.85;
    const swellVolume = excavationVolume * swell;
    const compactedVolume = excavationVolume * shrink;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Excavation Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Soil Type" fullWidth value={soilType} onChange={e => setSoilType(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.excavation.swellFactors).map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Volume (m³)" type="number" fullWidth value={excavationVolume} onChange={e => setExcavationVolume(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Swell volume: {swellVolume.toFixed(2)} m³</Typography>
              <Typography variant="body2">Compacted fill volume: {compactedVolume.toFixed(2)} m³</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Paint Tab ─────────────────────────────────────────────────────
  const renderPaintTab = () => {
    const coverage = conversionFactors.paint.coveragePerLitre[surfaceType] || 10;
    const totalPaint = (paintArea / coverage) * 2; // assuming 2 coats
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Paint Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Surface Type" fullWidth value={surfaceType} onChange={e => setSurfaceType(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.paint.coveragePerLitre).map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Area (m²)" type="number" fullWidth value={paintArea} onChange={e => setPaintArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Paint needed (2 coats): {totalPaint.toFixed(2)} L</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Timber Tab ────────────────────────────────────────────────────
  const renderTimberTab = () => {
    const volume = timberLength * timberWidth * timberThickness;
    const weight = volume * conversionFactors.timber.density;
    const boardfeet = volume * conversionFactors.timber.m3_to_boardfeet;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Timber Calculator</Typography>
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
              <Typography variant="body2">Volume: {volume.toFixed(4)} m³</Typography>
              <Typography variant="body2">Weight: {weight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Board feet: {boardfeet.toFixed(2)} BF</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Asphalt Tab ──────────────────────────────────────────────────
  const renderAsphaltTab = () => {
    const weight = asphaltVolume * conversionFactors.asphalt.density;
    const tonnes = asphaltVolume * conversionFactors.asphalt.m3_to_tonnes;
    return (
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
              <Typography variant="body2">Weight: {weight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Tonnes: {tonnes.toFixed(2)} t</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Aggregate Tab ──────────────────────────────────────────────────
  const renderAggregateTab = () => {
    const weight = aggregateVolume * conversionFactors.aggregate.density;
    const tonnes = aggregateVolume * conversionFactors.aggregate.m3_to_tonnes;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Aggregate Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Volume (m³)" type="number" fullWidth value={aggregateVolume} onChange={e => setAggregateVolume(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Weight: {weight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Tonnes: {tonnes.toFixed(2)} t</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Soil Tab ──────────────────────────────────────────────────────
  const renderSoilTab = () => {
    const lbft3 = soilDensity * conversionFactors.soil.density_kgm3_to_lbft3;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Soil Density Converter</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Density (kg/m³)" type="number" fullWidth value={soilDensity} onChange={e => setSoilDensity(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Density in lb/ft³: {lbft3.toFixed(2)} lb/ft³</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Slope Tab ──────────────────────────────────────────────────────
  const renderSlopeTab = () => {
    const percent = conversionFactors.slope.degrees_to_percent(slopeDegrees);
    const ratio = conversionFactors.slope.degrees_to_ratio(slopeDegrees);
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Slope Converter</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Angle (°)" type="number" fullWidth value={slopeDegrees} onChange={e => setSlopeDegrees(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Slope (%): {percent.toFixed(2)}%</Typography>
              <Typography variant="body2">Ratio (1 in X): {ratio.toFixed(2)}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Pipe Tab ──────────────────────────────────────────────────────
  const renderPipeTab = () => {
    const wallThickness = conversionFactors.pipe.schedule40Wall[pipeDiameter] || 3.91;
    const id = pipeDiameter - 2 * wallThickness;
    const crossSection = Math.PI * (pipeDiameter / 2) ** 2 / 1000000; // m²
    const volume = crossSection * pipeLength;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Pipe Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Nominal Diameter (mm)" fullWidth value={pipeDiameter} onChange={e => setPipeDiameter(parseInt(e.target.value) || 50)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.pipe.schedule40Wall).map(d => <option key={d} value={d}>{d} mm</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Length (m)" type="number" fullWidth value={pipeLength} onChange={e => setPipeLength(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Wall thickness: {wallThickness.toFixed(2)} mm</Typography>
              <Typography variant="body2">Internal diameter: {id.toFixed(2)} mm</Typography>
              <Typography variant="body2">Internal volume: {volume.toFixed(4)} m³</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Ceiling Tab ──────────────────────────────────────────────────
  const renderCeilingTab = () => {
    const tilesPerM2 = conversionFactors.ceiling.tilesPerM2[ceilingTileSize] || 2.78;
    const totalTiles = Math.ceil(ceilingArea * tilesPerM2);
    const boardWeight = conversionFactors.ceiling.boardWeights[ceilingBoardThickness] || 9.8;
    const gridMain = ceilingArea * conversionFactors.ceiling.gridPerM2.main_tees;
    const gridCross = ceilingArea * conversionFactors.ceiling.gridPerM2.cross_tees;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Ceiling Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Tile Size" fullWidth value={ceilingTileSize} onChange={e => setCeilingTileSize(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.ceiling.tilesPerM2).map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Area (m²)" type="number" fullWidth value={ceilingArea} onChange={e => setCeilingArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Board Thickness" fullWidth value={ceilingBoardThickness} onChange={e => setCeilingBoardThickness(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.ceiling.boardWeights).map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Tiles needed: {totalTiles} pcs</Typography>
              <Typography variant="body2">Board weight: {boardWeight} kg/m²</Typography>
              <Typography variant="body2">Main tees: {gridMain.toFixed(2)} m</Typography>
              <Typography variant="body2">Cross tees: {gridCross.toFixed(2)} m</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Aluminium Tab ─────────────────────────────────────────────────
  const renderAluminiumTab = () => {
    const profileWeight = conversionFactors.aluminium.profiles[aluminiumProfile] || 1.5;
    const totalWeight = profileWeight * aluminiumLength;
    const density = conversionFactors.aluminium.density;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Aluminium Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Profile Type" fullWidth value={aluminiumProfile} onChange={e => setAluminiumProfile(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.aluminium.profiles).map(p => <option key={p} value={p}>{p}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Length (m)" type="number" fullWidth value={aluminiumLength} onChange={e => setAluminiumLength(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Profile weight: {profileWeight} kg/m</Typography>
              <Typography variant="body2">Total weight: {totalWeight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Volume: {(totalWeight / density).toFixed(4)} m³</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Drywall Tab ──────────────────────────────────────────────────
  const renderDrywallTab = () => {
    const boardWeight = conversionFactors.drywall.boardWeights[drywallBoardThickness] || 9.8;
    const totalWeight = boardWeight * drywallArea;
    const screws = drywallArea * conversionFactors.drywall.screwsPerM2;
    const compound = drywallArea * conversionFactors.drywall.jointCompoundPerM2;
    const tape = drywallArea * conversionFactors.drywall.tapePerM2;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Drywall Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Board Thickness" fullWidth value={drywallBoardThickness} onChange={e => setDrywallBoardThickness(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.drywall.boardWeights).map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Area (m²)" type="number" fullWidth value={drywallArea} onChange={e => setDrywallArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Board weight: {boardWeight} kg/m²</Typography>
              <Typography variant="body2">Total weight: {totalWeight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Screws: {screws.toFixed(0)} pcs</Typography>
              <Typography variant="body2">Joint compound: {compound.toFixed(2)} kg</Typography>
              <Typography variant="body2">Tape: {tape.toFixed(2)} m</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Tiling Tab ────────────────────────────────────────────────────
  const renderTilingTab = () => {
    const piecesPerM2 = conversionFactors.tiling.tileSizes[tileSize] || 2.78;
    const basePieces = Math.ceil(tileArea * piecesPerM2);
    const wastageFactor = 1 + (tileWastage / 100);
    const totalPieces = Math.ceil(basePieces * wastageFactor);
    const adhesive = tileArea * conversionFactors.tiling.adhesivePerM2;
    const grout = tileArea * (conversionFactors.tiling.groutPerM2[tileSize] || 0.25);
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Tiling Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Tile Size" fullWidth value={tileSize} onChange={e => setTileSize(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.tiling.tileSizes).map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Area (m²)" type="number" fullWidth value={tileArea} onChange={e => setTileArea(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Wastage (%)" type="number" fullWidth value={tileWastage} onChange={e => setTileWastage(parseFloat(e.target.value) || 5)} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Tiles needed (base): {basePieces} pcs</Typography>
              <Typography variant="body2">Tiles with wastage: {totalPieces} pcs</Typography>
              <Typography variant="body2">Adhesive: {adhesive.toFixed(2)} kg</Typography>
              <Typography variant="body2">Grout: {grout.toFixed(2)} kg</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── CCTV Tab ──────────────────────────────────────────────────────
  const renderCctvTab = () => {
    const powerPerCamera = conversionFactors.cctv.cameraPower[cctvCameraType] || 6;
    const totalPower = powerPerCamera * cctvCameras;
    const cableWeight = conversionFactors.cctv.cableTypes[cctvCableType] || 0.04;
    const totalCableWeight = cableWeight * cctvCableLength * cctvCameras;
    const storagePerDay = conversionFactors.cctv.storagePerCamera[cctvCameraType] || 4;
    const totalStorage = storagePerDay * cctvCameras * cctvDays;
    const lossPer100m = conversionFactors.cctv.cableLoss[cctvCableType] || 2.0;
    const totalLoss = (cctvCableLength / 100) * lossPer100m;
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>CCTV Calculator</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Camera Type" fullWidth value={cctvCameraType} onChange={e => setCctvCameraType(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.cctv.cameraPower).map(c => <option key={c} value={c}>{c}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Number of Cameras" type="number" fullWidth value={cctvCameras} onChange={e => setCctvCameras(Math.max(1, parseInt(e.target.value) || 1))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Cable Type" fullWidth value={cctvCableType} onChange={e => setCctvCableType(e.target.value)} SelectProps={{ native: true }}>
              {Object.keys(conversionFactors.cctv.cableTypes).map(c => <option key={c} value={c}>{c}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Cable Length per Camera (m)" type="number" fullWidth value={cctvCableLength} onChange={e => setCctvCableLength(parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Recording Days" type="number" fullWidth value={cctvDays} onChange={e => setCctvDays(Math.max(1, parseInt(e.target.value) || 1))} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="body2">Total Power: {totalPower} W</Typography>
              <Typography variant="body2">Total Cable Weight: {totalCableWeight.toFixed(2)} kg</Typography>
              <Typography variant="body2">Storage Required: {totalStorage} GB ({ (totalStorage / 1000).toFixed(2) } TB)</Typography>
              <Typography variant="body2">Cable Loss (total): {totalLoss.toFixed(2)} dB</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ─── Tab panel router ──────────────────────────────────────────────
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
      case 16: return renderCeilingTab();
      case 17: return renderAluminiumTab();
      case 18: return renderDrywallTab();
      case 19: return renderTilingTab();
      case 20: return renderCctvTab();
      default: return null;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────
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
          <Tab label="Ceiling" />
          <Tab label="Aluminium" />
          <Tab label="Drywall" />
          <Tab label="Tiling" />
          <Tab label="CCTV" />
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