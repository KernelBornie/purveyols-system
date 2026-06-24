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
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import GanttChart from '../../components/GanttChart';

const ProjectPlanning = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
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

  const viewOnlyRoles = ['driver', 'receptionist', 'safety-officer'];
  const isViewOnly = viewOnlyRoles.includes(user?.role);

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

  // ─── Save plan with validation ──────────────────────────────
  const savePlan = async () => {
    if (isViewOnly) return;
    // Filter out tasks with empty names
    const validTasks = plan.tasks.filter(t => t.name && t.name.trim() !== '');
    const validMilestones = plan.milestones.filter(m => m.name && m.name.trim() !== '');

    if (validTasks.length !== plan.tasks.length) {
      setMessage({ type: 'error', text: 'Some tasks have empty names. Please remove or rename them.' });
      return;
    }
    if (validMilestones.length !== plan.milestones.length) {
      setMessage({ type: 'error', text: 'Some milestones have empty names. Please remove or rename them.' });
      return;
    }

    try {
      await api.post('/api/project-plans', { ...plan, tasks: validTasks, milestones: validMilestones, project: projectId });
      setMessage({ type: 'success', text: 'Plan saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    }
  };

  // ─── Task handlers ──────────────────────────────────────────
  const handleAddTask = () => {
    if (isViewOnly) return;
    setEditingTask(null);
    setTaskForm({ name: '', startDate: new Date(), endDate: new Date(Date.now() + 7*24*60*60*1000), progress: 0, status: 'not-started', assignedTo: '' });
    setTaskDialog(true);
  };

  const handleEditTask = (task, idx) => {
    if (isViewOnly) return;
    setEditingTask(idx);
    setTaskForm({ ...task });
    setTaskDialog(true);
  };

  const handleSaveTask = () => {
    // ─── VALIDATE task name ──────────────────────────────────
    if (!taskForm.name || taskForm.name.trim() === '') {
      setMessage({ type: 'error', text: 'Task name is required.' });
      return;
    }
    const newTask = { ...taskForm, name: taskForm.name.trim() };
    if (editingTask !== null) {
      const tasks = [...plan.tasks];
      tasks[editingTask] = newTask;
      setPlan({ ...plan, tasks });
    } else {
      setPlan({ ...plan, tasks: [...plan.tasks, newTask] });
    }
    setTaskDialog(false);
    setMessage(null);
  };

  const handleDeleteTask = (idx) => {
    if (isViewOnly) return;
    if (!window.confirm('Delete this task?')) return;
    const tasks = plan.tasks.filter((_, i) => i !== idx);
    setPlan({ ...plan, tasks });
  };

  // ─── Milestone handlers ──────────────────────────────────
  const handleAddMilestone = () => {
    if (isViewOnly) return;
    setMilestoneForm({ name: '', dueDate: new Date(), status: 'pending' });
    setMilestoneDialog(true);
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.name || milestoneForm.name.trim() === '') {
      setMessage({ type: 'error', text: 'Milestone name is required.' });
      return;
    }
    setPlan({ ...plan, milestones: [...plan.milestones, { ...milestoneForm, name: milestoneForm.name.trim() }] });
    setMilestoneDialog(false);
    setMessage(null);
  };

  const handleDeleteMilestone = (idx) => {
    if (isViewOnly) return;
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
        {!isViewOnly && (
          <Button variant="contained" onClick={savePlan} sx={{ mr: 1 }}>Save Plan</Button>
        )}
      </Box>

      {isViewOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view‑only access to this plan. Edits are disabled.
        </Alert>
      )}

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? <CircularProgress /> : (
        <>
          {/* ─── Gantt Chart ────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Gantt Chart</Typography>
              {!isViewOnly && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddTask}>
                  Add Task
                </Button>
              )}
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
                  {!isViewOnly && (
                    <Box sx={{ mt: 1 }}>
                      <IconButton size="small" onClick={() => handleEditTask(task, idx)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTask(idx)}><DeleteIcon /></IconButton>
                    </Box>
                  )}
                </Card>
              ))}
              {plan.tasks.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>No tasks added yet.</Typography>
              )}
            </Box>
          </Paper>

          {/* ─── Milestones ────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Milestones</Typography>
              {!isViewOnly && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddMilestone}>
                  Add Milestone
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {plan.milestones.map((ms, idx) => (
                <Card key={idx} sx={{ width: 250, p: 2 }}>
                  <Typography variant="subtitle1">{ms.name}</Typography>
                  <Typography variant="caption">Due: {new Date(ms.dueDate).toLocaleDateString()}</Typography>
                  <Chip label={ms.status} size="small" color={ms.status === 'achieved' ? 'success' : ms.status === 'missed' ? 'error' : 'warning'} sx={{ mt: 1 }} />
                  {!isViewOnly && (
                    <IconButton size="small" onClick={() => handleDeleteMilestone(idx)}><DeleteIcon /></IconButton>
                  )}
                </Card>
              ))}
              {plan.milestones.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>No milestones set.</Typography>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* ─── Task Dialog ────────────────────────────────── */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask !== null ? 'Edit Task' : 'New Task'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Name *"
            fullWidth
            margin="dense"
            value={taskForm.name}
            onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
            required
            error={!taskForm.name || taskForm.name.trim() === ''}
            helperText={!taskForm.name || taskForm.name.trim() === '' ? 'Task name is required' : ''}
          />
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
          <TextField
            label="Milestone Name *"
            fullWidth
            margin="dense"
            value={milestoneForm.name}
            onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
            required
            error={!milestoneForm.name || milestoneForm.name.trim() === ''}
            helperText={!milestoneForm.name || milestoneForm.name.trim() === '' ? 'Milestone name is required' : ''}
          />
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