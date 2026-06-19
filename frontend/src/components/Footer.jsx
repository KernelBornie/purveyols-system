import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 4,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="textSecondary" align="center">
          © {new Date().getFullYear()} PURVEYOLS CMS – Construction Management System
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 0.5 }}>
          Built with ❤️ for construction professionals
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 0.5 }}>
          Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lucknow, Zanzibar
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
