require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SHEETS, HEADERS, ensureSheet } = require('./utils/sheets');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const technicianRoutes = require('./routes/technicians');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.set('trust proxy', 1);

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://supportgsheets.onrender.com',
  credentials: true,
}));

// ❌ Removed: express-session (was causing cookie issues in prod)

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'Google Sheets' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initSheets();
});
