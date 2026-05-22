require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');

const { SHEETS, HEADERS, ensureSheet } = require('./utils/sheets');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const technicianRoutes = require('./routes/technicians');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Trust Render proxy
app.set('trust proxy', 1);

// Initialize sheets
async function initSheets() {
  try {
    await ensureSheet(SHEETS.USERS, HEADERS.USERS);
    await ensureSheet(SHEETS.TECHNICIANS, HEADERS.TECHNICIANS);
    await ensureSheet(SHEETS.PROJECTS, HEADERS.PROJECTS);

    console.log('✅ Google Sheets initialized');

    const { seedDefaultUser } = require('./routes/auth');
    await seedDefaultUser();

  } catch (err) {
    console.error('❌ Sheets init error:', err.message);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://supportgsheets.onrender.com',
  credentials: true,
}));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'edi_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: 'Google Sheets',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initSheets();
});
