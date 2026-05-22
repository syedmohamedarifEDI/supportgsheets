const express = require('express');
const router = express.Router();
const { SHEETS, HEADERS, readSheet, appendRow, updateRow, deleteRow } = require('../utils/sheets');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const technicians = await readSheet(SHEETS.TECHNICIANS);
    res.json(technicians.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ ...t, _id: t.id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: 'Technician name is required' });

    const id = name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const technician = {
      id,
      name: name.trim(),
      email: email || '',
      createdAt: new Date().toISOString(),
    };
    await appendRow(SHEETS.TECHNICIANS, HEADERS.TECHNICIANS, technician);
    res.status(201).json({ ...technician, _id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: 'Technician name is required' });

    const updated = await updateRow(SHEETS.TECHNICIANS, HEADERS.TECHNICIANS, req.params.id, {
      name: name.trim(),
      email: email || '',
    });
    if (!updated) return res.status(404).json({ error: 'Technician not found' });
    const all = await readSheet(SHEETS.TECHNICIANS);
    const t = all.find(t => t.id === req.params.id);
    res.json({ ...t, _id: t.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteRow(SHEETS.TECHNICIANS, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Technician not found' });
    res.json({ message: 'Technician deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;