import React from 'react';
import { Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Back', to = null }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleClick}
        variant="outlined"
        size="small"
      >
        {label}
      </Button>
    </Box>
  );
};

export default BackButton;
