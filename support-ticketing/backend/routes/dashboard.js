const express = require('express');
const router = express.Router();
const { SHEETS, readSheet } = require('../utils/sheets');
const { requireAuth } = require('../middleware/auth');

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const projects = await readSheet(SHEETS.PROJECTS);
    let allTickets = [];

    for (const proj of projects) {
      try {
        const tickets = await readSheet(proj.projectName);
        allTickets = allTickets.concat(tickets);
      } catch (_) {}
    }

    const count = (status) => allTickets.filter(t => t.status === status).length;

    const recent = allTickets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(t => ({
        ...t,
        _id: t.id,
        projectId:  { _id: t.projectId,  projectName: t.projectName },
        assignedTo: { _id: t.assignedTo, name: t.assignedToName },
      }));

    res.json({
      total:         allTickets.length,
      open:          count('Open'),
      inProgress:    count('In Progress'),
      onHold:        count('On Hold'),
      resolved:      count('Resolved'),
      closed:        count('Closed'),
      recentTickets: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
