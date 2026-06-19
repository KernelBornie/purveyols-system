import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DeliveryNote = () => {
  return (
    <Box
      sx={{
        borderRadius: 3,
        padding: '22px 26px',
        border: '1px solid #e9edf2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: 3,
        backgroundImage: 'url(/Deliver note.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 140,
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 26, 46, 0.55)',
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', color: '#fff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 24px' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <DescriptionIcon sx={{ color: '#ffd966', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Delivery Note
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: '#7ddfb0', verticalAlign: 'middle' }} />
              You have <strong>3 pending</strong> delivery notes to complete. Review and confirm shipments.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#ffd966',
            color: '#0b1a2e',
            fontWeight: 700,
            '&:hover': { backgroundColor: '#f7d04a' },
          }}
          startIcon={<DescriptionIcon />}
        >
          View Delivery Notes
        </Button>
      </Box>
    </Box>
  );
};

export default DeliveryNote;