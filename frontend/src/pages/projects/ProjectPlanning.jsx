import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, Button, TextField, IconButton,
  Chip, CircularProgress, Alert, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';
import GanttChart from '../../components/GanttChart';

const ProjectPlanning = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState({ tasks: [], milestones: [] });
  const [message, setMessage] = useState(null);
  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7*24*60*60*1000),
    progress: 0,
    status: 'not-started',
    assignedTo: '',
  });
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', dueDate: new Date(), status: 'pending' });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planRes, userRes] = await Promise.all([
        api.get(`/api/project-plans/project/${projectId}`),
        api.get('/api/users')
      ]);
      setPlan(planRes.data || { tasks: [], milestones: [] });
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load plan' });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    try {
      await api.post('/api/project-plans', { ...plan, project: projectId });
      setMessage({ type: 'success', text: 'Plan saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    }
  };

  // ─── Task handlers ──────────────────────────────────
  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({ name: '', startDate: new Date(), endDate: new Date(Date.now() + 7*24*60*60*1000), progress: 0, status: 'not-started', assignedTo: '' });
    setTaskDialog(true);
  };

  const handleEditTask = (task, idx) => {
    setEditingTask(idx);
    setTaskForm({ ...task });
    setTaskDialog(true);
  };

  const handleSaveTask = () => {
    const newTask = { ...taskForm };
    if (editingTask !== null) {
      const tasks = [...plan.tasks];
      tasks[editingTask] = newTask;
      setPlan({ ...plan, tasks });
    } else {
      setPlan({ ...plan, tasks: [...plan.tasks, newTask] });
    }
    setTaskDialog(false);
  };

  const handleDeleteTask = (idx) => {
    if (!window.confirm('Delete this task?')) return;
    const tasks = plan.tasks.filter((_, i) => i !== idx);
    setPlan({ ...plan, tasks });
  };

  // ─── Milestone handlers ──────────────────────────────────
  const handleAddMilestone = () => {
    setMilestoneForm({ name: '', dueDate: new Date(), status: 'pending' });
    setMilestoneDialog(true);
  };

  const handleSaveMilestone = () => {
    setPlan({ ...plan, milestones: [...plan.milestones, milestoneForm] });
    setMilestoneDialog(false);
  };

  const handleDeleteMilestone = (idx) => {
    if (!window.confirm('Delete this milestone?')) return;
    const milestones = plan.milestones.filter((_, i) => i !== idx);
    setPlan({ ...plan, milestones });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Project Planning
        </Typography>
        <Button variant="contained" onClick={savePlan} sx={{ mr: 1 }}>Save Plan</Button>
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? <CircularProgress /> : (
        <>
          {/* ─── Gantt Chart ────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Gantt Chart</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddTask}>
                Add Task
              </Button>
            </Box>
            <GanttChart tasks={plan.tasks} />
          </Paper>

          {/* ─── Tasks Table ────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Tasks</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {plan.tasks.map((task, idx) => (
                <Card key={idx} sx={{ width: 280, p: 2 }}>
                  <Typography variant="subtitle1">{task.name}</Typography>
                  <Typography variant="caption" display="block">Start: {new Date(task.startDate).toLocaleDateString()}</Typography>
                  <Typography variant="caption" display="block">End: {new Date(task.endDate).toLocaleDateString()}</Typography>
                  <Chip label={task.status} size="small" color={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'default'} sx={{ mt: 1 }} />
                  <Box sx={{ mt: 1 }}>
                    <IconButton size="small" onClick={() => handleEditTask(task, idx)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTask(idx)}><DeleteIcon /></IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* ─── Milestones ────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Milestones</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddMilestone}>
                Add Milestone
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {plan.milestones.map((ms, idx) => (
                <Card key={idx} sx={{ width: 250, p: 2 }}>
                  <Typography variant="subtitle1">{ms.name}</Typography>
                  <Typography variant="caption">Due: {new Date(ms.dueDate).toLocaleDateString()}</Typography>
                  <Chip label={ms.status} size="small" color={ms.status === 'achieved' ? 'success' : ms.status === 'missed' ? 'error' : 'warning'} sx={{ mt: 1 }} />
                  <IconButton size="small" onClick={() => handleDeleteMilestone(idx)}><DeleteIcon /></IconButton>
                </Card>
              ))}
            </Box>
          </Paper>
        </>
      )}

      {/* ─── Task Dialog ────────────────────────────────── */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask !== null ? 'Edit Task' : 'New Task'}</DialogTitle>
        <DialogContent>
          <TextField label="Task Name" fullWidth margin="dense" value={taskForm.name} onChange={e => setTaskForm({ ...taskForm, name: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker selected={taskForm.startDate} onChange={date => setTaskForm({ ...taskForm, startDate: date })} customInput={<TextField label="Start Date" fullWidth margin="dense" />} />
            <DatePicker selected={taskForm.endDate} onChange={date => setTaskForm({ ...taskForm, endDate: date })} customInput={<TextField label="End Date" fullWidth margin="dense" />} />
          </Box>
          <TextField select label="Status" fullWidth margin="dense" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
            <MenuItem value="not-started">Not Started</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="delayed">Delayed</MenuItem>
          </TextField>
          <TextField
            select label="Assigned To" fullWidth margin="dense" value={taskForm.assignedTo || ''} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
          </TextField>
          <TextField label="Progress (%)" type="number" fullWidth margin="dense" value={taskForm.progress} onChange={e => setTaskForm({ ...taskForm, progress: Math.min(100, Math.max(0, Number(e.target.value))) })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTask}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Milestone Dialog ────────────────────────────────── */}
      <Dialog open={milestoneDialog} onClose={() => setMilestoneDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Milestone</DialogTitle>
        <DialogContent>
          <TextField label="Milestone Name" fullWidth margin="dense" value={milestoneForm.name} onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })} />
          <DatePicker selected={milestoneForm.dueDate} onChange={date => setMilestoneForm({ ...milestoneForm, dueDate: date })} customInput={<TextField label="Due Date" fullWidth margin="dense" />} />
          <TextField select label="Status" fullWidth margin="dense" value={milestoneForm.status} onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value })}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="achieved">Achieved</MenuItem>
            <MenuItem value="missed">Missed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMilestone}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProjectPlanning;