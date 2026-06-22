import React, { useState, useEffect } from 'react';
import { Chip, Tooltip } from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { getSyncStatus } from '../utils/offlineSync';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    const updateSyncStatus = async () => {
      const status = await getSyncStatus();
      setPendingSync(status.pending);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Check sync status periodically
    const interval = setInterval(updateSyncStatus, 10000);
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline) {
    return (
      <Tooltip title={`Online${pendingSync > 0 ? ` (${pendingSync} pending sync)` : ''}`}>
        <Chip
          icon={<SignalCellularAltIcon />}
          label={pendingSync > 0 ? `📤 ${pendingSync}` : 'Online'}
          size="small"
          color={pendingSync > 0 ? 'warning' : 'success'}
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Offline - Changes will sync when back online">
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
