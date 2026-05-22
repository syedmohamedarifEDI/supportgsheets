const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { SHEETS, HEADERS, readSheet, appendRow, ensureSheet } = require('../utils/sheets');

const HARDCODED_USERNAME = process.env.ADMIN_EMAIL;
const HARDCODED_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedDefaultUser() {
  try {
    await ensureSheet(SHEETS.USERS, HEADERS.USERS);
    const users = await readSheet(SHEETS.USERS);
    const exists = users.find(u => u.username === HARDCODED_USERNAME);
    if (!exists) {
      const hashed = await bcrypt.hash(HARDCODED_PASSWORD, 10);
      await appendRow(SHEETS.USERS, HEADERS.USERS, {
        id:       'admin_user',
        username: HARDCODED_USERNAME,
        password: hashed,
      });
      console.log('✅ Default user seeded');
    }
  } catch (err) {
    console.error('Error seeding user:', err.message);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const users = await readSheet(SHEETS.USERS);
    const user  = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId   = user.id;
    req.session.username = user.username;
    return res.json({ message: 'Login successful', username: user.username });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.userId)
    return res.json({ username: req.session.username, loggedIn: true });
  return res.status(401).json({ loggedIn: false });
});

module.exports = router;
module.exports.seedDefaultUser = seedDefaultUser;