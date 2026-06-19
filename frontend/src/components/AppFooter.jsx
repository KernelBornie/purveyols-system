import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

const AppFooter = () => {
  return (
    <Box
      sx={{
        background: '#0b1a2e',
        padding: '24px 32px 20px',
        marginTop: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px 24px',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url(/background 2.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 26, 46, 0.8)',
          backdropFilter: 'blur(3px)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box component="img" src="/logo-branding.jpg" alt="Purveyols" sx={{ height: 38, borderRadius: 1, background: '#fff', padding: '4px 8px' }} />
        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          PURVEYOLS
          <Typography component="span" sx={{ display: 'block', fontWeight: 400, fontSize: 11, color: '#8ba0b9' }}>
            Building &amp; Civil Construction
          </Typography>
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#aac1dc', position: 'relative', zIndex: 1 }}>
        &copy; 2026 Purveyols Investments Limited &bull;
        <a href="mailto:purveyols@gmail.com" style={{ color: '#6f9eff', textDecoration: 'none' }}> purveyols@gmail.com</a>
        &bull; <a href="tel:+260211235354" style={{ color: '#6f9eff', textDecoration: 'none' }}>+260 211 235354</a>
      </Typography>
      <Stack direction="row" spacing={2} sx={{ color: '#aac1dc', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <span><i className="fas fa-tag"></i> v2.4</span>
        <span><i className="fas fa-map-pin"></i> Lusaka, Zambia</span>
      </Stack>
    </Box>
  );
};

export default AppFooter;