import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const CompanyHeader = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0b1a2e 0%, #1a3450 100%)',
        padding: '20px 32px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px 24px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '120px',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'url(/hero-bg.jpg) center center / cover no-repeat',
          opacity: 0.15,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        },
      }}
    >
      <Box className="company-header" sx={{ display: 'flex', alignItems: 'center', gap: '18px', zIndex: 1 }}>
        <Box
          component="img"
          src="/P LOGO.PNG"
          alt="Purveyols logo"
          sx={{ height: 60, borderRadius: 2, background: '#fff', padding: '6px 10px' }}
        />
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
            PURVEYOLS
          </Typography>
          <Typography variant="body2" sx={{ color: '#aac1dc' }}>
            Building and Civil Construction
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} />} sx={{ zIndex: 1, flexWrap: 'wrap', gap: '8px 16px' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocationOnIcon sx={{ color: '#6f9eff', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#c9dcee' }}>
            Plot No. 8, Buchi Road – Northmead, P.O. Box NH 87 Lusaka, Zambia
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PhoneIcon sx={{ color: '#6f9eff', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#c9dcee' }}>
            <a href="tel:+260211235354" style={{ color: '#c9dcee', textDecoration: 'none' }}>+260 211 235354</a>
            {' / '}
            <a href="tel:+260977393879" style={{ color: '#c9dcee', textDecoration: 'none' }}>+260 977 393879</a>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmailIcon sx={{ color: '#6f9eff', fontSize: 18 }} />
          <Typography variant="body2">
            <a href="mailto:purveyols@gmail.com" style={{ color: '#c9dcee', textDecoration: 'none' }}>purveyols@gmail.com</a>
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CompanyHeader;