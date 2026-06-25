import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Grid, TextField, Typography, Paper, Chip
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';

const conversionFactors = {
  area: {
    m2_to_ft2: 10.7639,
    ft2_to_m2: 0.092903,
    m2_to_yd2: 1.19599,
    yd2_to_m2: 0.836127,
    ha_to_m2: 10000,
    m2_to_ha: 0.0001,
  },
  volume: {
    m3_to_yd3: 1.30795,
    yd3_to_m3: 0.764555,
    m3_to_ft3: 35.3147,
    ft3_to_m3: 0.0283168,
    litres_to_m3: 0.001,
    m3_to_litres: 1000,
  },
  length: {
    m_to_ft: 3.28084,
    ft_to_m: 0.3048,
    m_to_yd: 1.09361,
    yd_to_m: 0.9144,
    km_to_m: 1000,
    m_to_km: 0.001,
  },
  weight: {
    kg_to_ton: 0.001,
    ton_to_kg: 1000,
    kg_to_lbs: 2.20462,
    lbs_to_kg: 0.453592,
    ton_to_lbs: 2204.62,
    lbs_to_ton: 0.000453592,
  },
  concrete: {
    mixRatios: {
      'C15': { cement: 1, sand: 3, aggregate: 6 },
      'C20': { cement: 1, sand: 2, aggregate: 4 },
      'C25': { cement: 1, sand: 1.5, aggregate: 3 },
      'C30': { cement: 1, sand: 1, aggregate: 2 },
      'C35': { cement: 1, sand: 0.75, aggregate: 1.5 },
    },
    materialsPerM3: {
      cement: 300,
      sand: 600,
      aggregate: 1200,
      water: 150,
    },
  },
  steel: {
    barWeights: {
      6: 0.222,
      8: 0.395,
      10: 0.617,
      12: 0.888,
      16: 1.579,
      20: 2.466,
      25: 3.854,
      32: 6.313,
      40: 9.864,
    },
  },
};

const ConversionTool = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState(null);
  const [concreteMix, setConcreteMix] = useState('C20');
  const [concreteVolume, setConcreteVolume] = useState(1);
  const [steelDiameter, setSteelDiameter] = useState(12);
  const [steelLength, setSteelLength] = useState(1);

  const handleConvert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return;
    let converted = 0;
    const key = `${fromUnit}_to_${toUnit}`;
    const factor = conversionFactors[getCategory()]?.[key];
    if (factor) {
      converted = value * factor;
    } else {
      const reverseKey = `${toUnit}_to_${fromUnit}`;
      if (conversionFactors[getCategory()]?.[reverseKey]) {
        converted = value / conversionFactors[getCategory()][reverseKey];
      } else {
        setResult('Conversion not supported');
        return;
      }
    }
    setResult(converted);
  };

  const getCategory = () => {
    const map = { 0: 'area', 1: 'volume', 2: 'length', 3: 'weight' };
    return map[tab] || 'area';
  };

  const renderConversionTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Unit Conversion</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="From"
            fullWidth
            value={fromUnit}
            onChange={e => setFromUnit(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select</option>
            {Object.keys(conversionFactors[getCategory()] || {}).map(k => {
              const parts = k.split('_to_');
              if (parts.length === 2) return <option key={parts[0]} value={parts[0]}>{parts[0]}</option>;
              return null;
            })}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="To"
            fullWidth
            value={toUnit}
            onChange={e => setToUnit(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select</option>
            {Object.keys(conversionFactors[getCategory()] || {}).map(k => {
              const parts = k.split('_to_');
              if (parts.length === 2) return <option key={parts[1]} value={parts[1]}>{parts[1]}</option>;
              return null;
            })}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Value"
            type="number"
            fullWidth
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
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

  const renderConcreteTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Concrete Mix Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Concrete Grade"
            fullWidth
            value={concreteMix}
            onChange={e => setConcreteMix(e.target.value)}
            SelectProps={{ native: true }}
          >
            {Object.keys(conversionFactors.concrete.mixRatios).map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Volume (m³)"
            type="number"
            fullWidth
            value={concreteVolume}
            onChange={e => setConcreteVolume(parseFloat(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">Mix Ratio:
              {Object.entries(conversionFactors.concrete.mixRatios[concreteMix]).map(([key, val]) => (
                <Chip key={key} label={`${key}: ${val}`} size="small" sx={{ ml: 1 }} />
              ))}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              For {concreteVolume} m³:
            </Typography>
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

  const renderSteelTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Steel Reinforcement Calculator</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Bar Diameter (mm)"
            fullWidth
            value={steelDiameter}
            onChange={e => setSteelDiameter(parseFloat(e.target.value))}
            SelectProps={{ native: true }}
          >
            {Object.keys(conversionFactors.steel.barWeights).map(d => (
              <option key={d} value={d}>{d}mm</option>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Length (m)"
            type="number"
            fullWidth
            value={steelLength}
            onChange={e => setSteelLength(parseFloat(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2">
              Weight per meter: {conversionFactors.steel.barWeights[steelDiameter]} kg/m
            </Typography>
            <Typography variant="body2">
              Total weight: {(conversionFactors.steel.barWeights[steelDiameter] * steelLength).toFixed(2)} kg
            </Typography>
            <Typography variant="body2">
              Number of bars: {Math.ceil(steelLength / 12)} (assuming 12m standard length)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTabPanel = () => {
    switch (tab) {
      case 0: return renderConversionTab();
      case 1: return renderConversionTab(); // Volume
      case 2: return renderConversionTab(); // Length
      case 3: return renderConversionTab(); // Weight
      case 4: return renderConcreteTab();
      case 5: return renderSteelTab();
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
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Area" />
          <Tab label="Volume" />
          <Tab label="Length" />
          <Tab label="Weight" />
          <Tab label="Concrete" />
          <Tab label="Steel" />
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