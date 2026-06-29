import React, { useState, useEffect } from 'react';
import { Chip, Tooltip } from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (isOnline) {
    return (
      <Tooltip title="You are connected to the internet">
        <Chip
          icon={<SignalCellularAltIcon />}
          label="Online"
          size="small"
          color="success"
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="You are offline – changes will sync when back online">
      <Chip
        icon={<SignalWifiOffIcon />}
        label="Offline"
        size="small"
        color="error"
        sx={{ ml: 1 }}
      />
    </Tooltip>
  );
};

export default NetworkStatus;