import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ExportButton from './ExportButton';
import ReportModal from './ReportModal';

const DashboardActions = ({ onExportCSV, onExportPDF, title = "Actions" }) => {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => setReportOpen(true)}>
        Generate Report
      </Button>
      <ExportButton onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </Box>
  );
};

export default DashboardActions;
