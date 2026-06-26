const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// ─── Create a meeting ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { invitedUsers, isPublic } = req.body;
    const userId = req.user.id;

    // Generate a unique room name
    const timestamp = Date.now().toString(36);
    const userIdShort = userId.slice(-6);
    const roomName = `PURVEYOLS-${userIdShort}-${timestamp}`;

    const meeting = new Meeting({
      roomName,
      createdBy: userId,
      invitedUsers: invitedUsers || [],
      isPublic: isPublic || false,
    });
    await meeting.save();

    // Send notifications to invited users
    const creator = await User.findById(userId);
    for (const invitedId of meeting.invitedUsers) {
      await createNotification(
        invitedId,
        'meeting_invite',
        'Video Meeting Invite',
        `${creator.name} invited you to a video meeting: ${meeting.roomName}`,
        `/video-call/${meeting.roomName}`
      );
    }

    res.status(201).json(meeting);
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get meeting by room name ─────────────────────────────────────
router.get('/:roomName', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomName: req.params.roomName });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    console.error('Get meeting error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Check if user can join ───────────────────────────────────────
router.get('/:roomName/check-access', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const meeting = await Meeting.findOne({ roomName: req.params.roomName });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (meeting.isPublic) {
      return res.json({ allowed: true });
    }
    const invited = meeting.invitedUsers.some(id => id.toString() === userId);
    if (invited) {
      return res.json({ allowed: true });
    }
    return res.status(403).json({ allowed: false, message: 'You are not invited to this meeting' });
  } catch (err) {
    console.error('Check access error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Add invitees to an existing meeting ──────────────────────────
router.put('/:roomName/invite', auth, async (req, res) => {
  try {
    const { invitedUsers } = req.body;
    const meeting = await Meeting.findOne({ roomName: req.params.roomName });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    // Only creator can invite more people
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the meeting creator can invite others' });
    }
    // Add new users without duplicates
    const existing = meeting.invitedUsers.map(id => id.toString());
    const newUsers = invitedUsers.filter(id => !existing.includes(id));
    meeting.invitedUsers.push(...newUsers);
    await meeting.save();

    // Notify new invitees
    const creator = await User.findById(req.user.id);
    for (const invitedId of newUsers) {
      await createNotification(
        invitedId,
        'meeting_invite',
        'Video Meeting Invite',
        `${creator.name} invited you to a video meeting: ${meeting.roomName}`,
        `/video-call/${meeting.roomName}`
      );
    }

    res.json(meeting);
  } catch (err) {
    console.error('Add invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;