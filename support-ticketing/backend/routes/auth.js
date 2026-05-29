const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SHEETS, HEADERS, readSheet, appendRow, ensureSheet } = require('../utils/sheets');

const HARDCODED_USERNAME = process.env.ADMIN_EMAIL;
const HARDCODED_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.SESSION_SECRET || 'edi_secret_key_2024';

async function seedDefaultUser() {
  try {
    await ensureSheet(SHEETS.USERS, HEADERS.USERS);
    const users = await readSheet(SHEETS.USERS);
    const exists = users.find(u => u.username === HARDCODED_USERNAME);
    if (!exists) {
      const hashed = await bcrypt.hash(HARDCODED_PASSWORD, 10);
      await appendRow(SHEETS.USERS, HEADERS.USERS, {
        id: 'admin_user',
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
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ Issue JWT instead of session
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ message: 'Login successful', username: user.username, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  // JWT is stateless — client just deletes the token
  return res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ loggedIn: false });
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ username: decoded.username, loggedIn: true });
  } catch {
    return res.status(401).json({ loggedIn: false });
  }
});

module.exports = router;
module.exports.seedDefaultUser = seedDefaultUser;
