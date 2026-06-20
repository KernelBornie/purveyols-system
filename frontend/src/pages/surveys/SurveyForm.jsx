import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem,
  Alert, CircularProgress, Chip, Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Map click handler component ──────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const SurveyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    project: '',
    surveyNumber: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyor: '',
    equipmentUsed: [],
    boundaryCoordinates: [],
    contours: [],
    area: 0,
    perimeter: 0,
    fileUrls: [],
    status: 'draft',
    cutVolume: 0,
    fillVolume: 0,
    netVolume: 0,
  });
  const [coords, setCoords] = useState([]);
  const [mapCenter, setMapCenter] = useState([-15.3875, 28.3228]); // Lusaka

  const equipmentOptions = ['Total Station', 'RTK GPS', 'Drone', 'Automatic Level'];

  // ─── Fetch data ──────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/users'),
        ]);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
        if (id) {
          const surveyRes = await api.get(`/api/surveys/${id}`);
          const data = surveyRes.data;
          setForm(data);
          setCoords(data.boundaryCoordinates.map(c => [c.northing, c.easting]));
          if (data.boundaryCoordinates.length > 0) {
            const avgLat = data.boundaryCoordinates.reduce((s, c) => s + c.northing, 0) / data.boundaryCoordinates.length;
            const avgLng = data.boundaryCoordinates.reduce((s, c) => s + c.easting, 0) / data.boundaryCoordinates.length;
            setMapCenter([avgLat, avgLng]);
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    fetchData();
  }, [id]);

  // ─── Map click handler ──────────────────────────────
  const handleMapClick = (lat, lng) => {
    setCoords([...coords, [lat, lng]]);
    setForm(prev => ({
      ...prev,
      boundaryCoordinates: [...prev.boundaryCoordinates, { northing: lat, easting: lng, elevation: 0 }],
    }));
  };

  // ─── Remove last point ──────────────────────────────
  const removeLastPoint = () => {
    if (coords.length === 0) return;
    const newCoords = coords.slice(0, -1);
    setCoords(newCoords);
    setForm(prev => ({
      ...prev,
      boundaryCoordinates: prev.boundaryCoordinates.slice(0, -1),
    }));
  };

  // ─── Calculate area and perimeter (Shoelace formula) ──
  const calculateAreaPerimeter = () => {
    if (coords.length < 3) {
      setMessage({ type: 'warning', text: 'Need at least 3 points to calculate area.' });
      return;
    }
    // Shoelace formula
    let area = 0;
    let perimeter = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
      const dx = coords[j][0] - coords[i][0];
      const dy = coords[j][1] - coords[i][1];
      perimeter += Math.sqrt(dx*dx + dy*dy);
    }
    area = Math.abs(area) / 2;
    // Convert lat/lng degrees to metres (approximate)
    // 1 degree ~ 111,320 m
    const scale = 111320;
    area = area * scale * scale;
    perimeter = perimeter * scale;
    setForm(prev => ({
      ...prev,
      area: area,
      perimeter: perimeter,
    }));
    setMessage({ type: 'success', text: 'Area and perimeter calculated!' });
  };

  // ─── Compute cut/fill ──────────────────────────────────
  const handleCalculateCutFill = async () => {
    if (!id) { alert('Save the survey first.'); return; }
    try {
      const res = await api.post(`/api/surveys/${id}/calculate`);
      setForm(prev => ({
        ...prev,
        cutVolume: res.data.cutVolume,
        fillVolume: res.data.fillVolume,
        netVolume: res.data.netVolume,
      }));
      setMessage({ type: 'success', text: 'Cut/fill computed!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Calculation failed' });
    }
  };

  // ─── Submit ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (id) {
        await api.put(`/api/surveys/${id}`, form);
        setMessage({ type: 'success', text: 'Survey updated!' });
      } else {
        await api.post('/api/surveys', form);
        setMessage({ type: 'success', text: 'Survey created!' });
      }
      setTimeout(() => navigate('/surveys'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEquipmentToggle = (equipment) => {
    const current = form.equipmentUsed || [];
    if (current.includes(equipment)) {
      setForm({ ...form, equipmentUsed: current.filter(e => e !== equipment) });
    } else {
      setForm({ ...form, equipmentUsed: [...current, equipment] });
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {id ? 'Edit Survey' : 'New Survey'}
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Survey Number *"
              name="surveyNumber"
              fullWidth
              value={form.surveyNumber}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Survey Date"
              name="surveyDate"
              type="date"
              fullWidth
              value={form.surveyDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Project"
              name="project"
              fullWidth
              value={form.project}
              onChange={handleChange}
              required
            >
              <MenuItem value="">Select Project</MenuItem>
              {projects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Surveyor"
              name="surveyor"
              fullWidth
              value={form.surveyor}
              onChange={handleChange}
            >
              <MenuItem value="">Select Surveyor</MenuItem>
              {users.map(u => (
                <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Equipment Used</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {equipmentOptions.map(equip => (
                <Chip
                  key={equip}
                  label={equip}
                  color={form.equipmentUsed?.includes(equip) ? 'primary' : 'default'}
                  onClick={() => handleEquipmentToggle(equip)}
                  variant={form.equipmentUsed?.includes(equip) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Status"
              name="status"
              select
              fullWidth
              value={form.status}
              onChange={handleChange}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* ─── Leaflet Map ──────────────────────────────────── */}
        <Typography variant="h6" gutterBottom>
          Boundary Coordinates (Click on map to add points)
        </Typography>
        <Box sx={{ height: 400, width: '100%', mb: 2 }}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {coords.map((point, idx) => (
              <Marker key={idx} position={point}>
                <Popup>Point {idx+1}: ({point[0].toFixed(4)}, {point[1].toFixed(4)})</Popup>
              </Marker>
            ))}
            {coords.length > 0 && (
              <>
                <Polyline positions={coords} color="blue" />
                {coords.length > 2 && <Polygon positions={coords} color="green" fillOpacity={0.2} />}
              </>
            )}
          </MapContainer>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={removeLastPoint} disabled={coords.length === 0}>
            Remove Last Point
          </Button>
          <Button variant="outlined" onClick={calculateAreaPerimeter} disabled={coords.length < 3}>
            Calculate Area & Perimeter
          </Button>
          <Button variant="outlined" onClick={handleCalculateCutFill} disabled={!id}>
            Compute Cut/Fill
          </Button>
        </Box>
        {form.area > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Area: {form.area.toFixed(2)} m²</Typography>
            <Typography variant="body2">Perimeter: {form.perimeter.toFixed(2)} m</Typography>
          </Box>
        )}
        {form.cutVolume > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Cut Volume: {form.cutVolume.toFixed(2)} m³</Typography>
            <Typography variant="body2">Fill Volume: {form.fillVolume.toFixed(2)} m³</Typography>
            <Typography variant="body2">Net Volume: {form.netVolume.toFixed(2)} m³</Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Survey'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/surveys')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SurveyForm;