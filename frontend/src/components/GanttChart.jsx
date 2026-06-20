import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const GanttChart = ({ tasks, startDate, endDate }) => {
  if (!tasks || tasks.length === 0) return <Typography>No tasks</Typography>;

  const projectStart = new Date(startDate || tasks.reduce((min, t) => new Date(t.startDate) < new Date(min) ? t.startDate : min, tasks[0].startDate));
  const projectEnd = new Date(endDate || tasks.reduce((max, t) => new Date(t.endDate) > new Date(max) ? t.endDate : max, tasks[0].endDate));
  const totalDays = (projectEnd - projectStart) / (1000 * 60 * 60 * 24);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {tasks.map((task, idx) => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);
          const startOffset = (taskStart - projectStart) / (1000 * 60 * 60 * 24);
          const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);
          const leftPercent = (startOffset / totalDays) * 100;
          const widthPercent = (duration / totalDays) * 100;

          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ width: 150, flexShrink: 0 }}>{task.name}</Typography>
              <Box sx={{ position: 'relative', flexGrow: 1, height: 24, bgcolor: '#eee', borderRadius: 1 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: leftPercent + '%',
                    width: widthPercent + '%',
                    height: '100%',
                    bgcolor: task.status === 'completed' ? '#4caf50' : task.status === 'in-progress' ? '#ff9800' : '#2196f3',
                    borderRadius: 1,
                    transition: 'all 0.3s',
                  }}
                />
                {task.progress > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: leftPercent + '%',
                      top: 0,
                      width: widthPercent + '%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LinearProgress variant="determinate" value={task.progress} sx={{ width: '90%', height: 6, bgcolor: 'rgba(255,255,255,0.4)' }} />
                  </Box>
                )}
              </Box>
              <Typography variant="caption" sx={{ ml: 1, width: 80 }}>
                {Math.round(task.progress)}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default GanttChart;