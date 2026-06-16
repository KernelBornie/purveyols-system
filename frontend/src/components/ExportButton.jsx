import React from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

const ExportButton = ({ onExportCSV, onExportPDF }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleClick}>
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {onExportCSV && (
          <MenuItem onClick={() => { handleClose(); onExportCSV(); }}>
            <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export as CSV</ListItemText>
          </MenuItem>
        )}
        {onExportPDF && (
          <MenuItem onClick={() => { handleClose(); onExportPDF(); }}>
            <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export as PDF</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ExportButton;
