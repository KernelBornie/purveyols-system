import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[800],
        color: 'white',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="lg">
        {/* --- Footer brand image --- */}
        <img
          src="/footer.PNG"
          alt="PURVEYOLS"
          height="40"
          style={{ marginBottom: 8 }}
        />
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} PURVEYOLS CMS – Construction Management System
        </Typography>
        <Typography variant="caption" display="block" sx={{ opacity: 0.6, mt: 0.5 }}>
        </Typography>
        <Typography variant="caption" display="block" sx={{ opacity: 0.5, mt: 0.5 }}>
          Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
