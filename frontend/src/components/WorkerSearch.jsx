import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Box, Typography
} from '@mui/material';
import api from '../api/axios';

const WorkerSearch = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/payments/workers/search?q=${query}`);
      setWorkers(res.data);
    } catch (err) {
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (worker) => {
    onSelect(worker);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Search Workers</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
          <TextField
            label="NRC or Phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
        {workers.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>NRC</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((w) => (
                <TableRow key={w._id}>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>{w.nrc}</TableCell>
                  <TableCell>{w.phone}</TableCell>
                  <TableCell>{w.site}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => handleSelect(w)}>
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography sx={{ mt: 2 }}>No workers found.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkerSearch;
