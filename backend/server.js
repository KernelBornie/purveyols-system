const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// ─── CORS (improved – allows all Vercel & Render subdomains) ──
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    console.warn(`❌ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'cache-control',
    'Accept',
    'Origin',
  ],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// ─── File upload configuration ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tenders/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tender-${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and PDFs are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// ─── Serve uploaded files statically ───────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Auto‑seed if database is empty ────────────────────────────────
const User = require('./models/User');
const { exec } = require('child_process');

const seedIfEmpty = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('⚡ No users found. Seeding database...');
      exec('npm run seed', (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Seed error: ${error.message}`);
          return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
        console.log('✅ Seeding completed.');
      });
    } else {
      console.log(`✅ Database already has ${count} users. Skipping seed.`);
    }
  } catch (err) {
    console.error('❌ Failed to check user count:', err);
  }
};

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat-history', require('./routes/chatHistory'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/advertised-projects', require('./routes/advertisedProjects'));
app.use('/api/mobile-money', require('./routes/mobileMoney'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/funding-requests', require('./routes/fundingRequests'));
app.use('/api/funding', require('./routes/funding'));
app.use('/api/logbooks', require('./routes/logbooks'));
app.use('/api/procurement', require('./routes/procurement'));
app.use('/api/boq', require('./routes/boq'));
app.use('/api/subcontracts', require('./routes/subcontracts'));
app.use('/api/safety-reports', require('./routes/safetyReports'));
app.use('/api/material-requests', require('./routes/materialRequests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/site-plans', require('./routes/sitePlans'));
app.use('/api/drawings', require('./routes/drawings'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/spare-parts', require('./routes/spareParts'));
// ─── Tenders ──────────────────────────────────────────────────────
app.use('/api/tenders', require('./routes/tenders'));

// ─── Project Planning ────────────────────────────────────────────
const projectPlanRoutes = require('./routes/projectPlans');
app.use('/api/project-plans', projectPlanRoutes);

const siteDiaryRoutes = require('./routes/siteDiary');
app.use('/api/site-diary', siteDiaryRoutes);

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ─── Socket.io Signaling for Video Calls ────────────────────────
const activeUsers = new Map();

app.get('/api/users/online', async (req, res) => {
  try {
    const onlineIds = Array.from(activeUsers.keys());
    const users = await User.find({ _id: { $in: onlineIds } })
      .select('_id name role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('register', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('call-user', ({ to, offer }) => {
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', {
        from: socket.userId,
        offer,
      });
      console.log(`📞 Call from ${socket.userId} to ${to}`);
    } else {
      socket.emit('call-error', { message: 'User is offline' });
    }
  });

  socket.on('answer-call', ({ to, answer }) => {
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-answered', { answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { candidate });
    }
  });

  socket.on('end-call', ({ to }) => {
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  socket.on('invite-to-meeting', ({ to, meetingLink, from, meetingName }) => {
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('meeting-invite', {
        from,
        meetingLink,
        meetingName: meetingName || 'Video Meeting',
      });
      console.log(`📨 Meeting invite from ${from} to ${to}`);
    } else {
      socket.emit('invite-error', { message: 'User is offline' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      console.log(`❌ User ${socket.userId} disconnected`);
    }
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Database Connection ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    seedIfEmpty();
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));