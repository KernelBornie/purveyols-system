const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// ─── Temporarily allow all origins for testing ──────────────────
const corsOptions = {
  origin: true, // ✅ allows any origin
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});
app.use(express.json({ limit: '50mb' })); // ✅ Increased limit for images
app.use(morgan('dev'));

// ─── Auto‑seed if database is empty ──────────────────────────────
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

// ─── Routes ──────────────────────────────────────────────────────
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

// ─── Spare Parts (for drivers) ──────────────────────────────────
app.use('/api/spare-parts', require('./routes/spareParts'));

// ─── Project Planning ────────────────────────────────────────────
const projectPlanRoutes = require('./routes/projectPlans');
app.use('/api/project-plans', projectPlanRoutes);

const siteDiaryRoutes = require('./routes/siteDiary');
app.use('/api/site-diary', siteDiaryRoutes);

// ─── OpenAI test endpoint (optional) ────────────────────────────
// app.use('/api/test-openai', require('./routes/test-openai'));

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;

// ─── Connect and start ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    seedIfEmpty();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
