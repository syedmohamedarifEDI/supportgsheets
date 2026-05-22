const express = require('express');
const router = express.Router();
const { HEADERS, ensureSheet, readSheet, appendRow, updateRow, deleteRow, SHEETS } = require('../utils/sheets');
const { requireAuth } = require('../middleware/auth');

const VALID_STATUSES   = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const VALID_PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

function isValidDateTime(val) {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val);
}

function nowIST() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace('T', ' ');
}

function makeTicketId() {
  return 'TKT_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
}

function validateBody(body, isUpdate = false) {
  const errors = [];
  if (!isUpdate || body.issue !== undefined)
    if (!body.issue?.trim()) errors.push('Issue is required');
  if (!isUpdate || body.assignedTo !== undefined)
    if (!body.assignedTo) errors.push('Assigned To is required');
  if (!isUpdate || body.businessCriticality !== undefined)
    if (!VALID_PRIORITIES.includes(body.businessCriticality)) errors.push('Business Criticality must be P1-P4');
  if (!isUpdate || body.status !== undefined)
    if (!VALID_STATUSES.includes(body.status)) errors.push('Invalid status');
  if (!isUpdate || body.executionId !== undefined)
    if (!body.executionId?.trim()) errors.push('Execution ID is required');
  if (body.incidentStartTime && !isValidDateTime(body.incidentStartTime))
    errors.push('Start time must be YYYY-MM-DD HH:mm:ss');
  if (body.incidentEndTime && !isValidDateTime(body.incidentEndTime))
    errors.push('End time must be YYYY-MM-DD HH:mm:ss');
  return errors;
}

async function getProjectName(projectId) {
  const projects = await readSheet(SHEETS.PROJECTS);
  const p = projects.find(p => p.id === projectId || p.projectName === projectId);
  return p ? p.projectName : '';
}

async function getTechnicianName(techId) {
  const techs = await readSheet(SHEETS.TECHNICIANS);
  const t = techs.find(t => t.id === techId);
  return t ? t.name : techId;
}

function shapeTicket(t) {
  return {
    ...t,
    _id: t.id,
    projectId:  { _id: t.projectId,  projectName: t.projectName },
    assignedTo: { _id: t.assignedTo, name: t.assignedToName },
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId, status, assignedTo, page = 1, limit = 20 } = req.query;
    const projects = await readSheet(SHEETS.PROJECTS);
    let allTickets = [];

    for (const proj of projects) {
      try {
        const tickets = await readSheet(proj.projectName);
        allTickets = allTickets.concat(tickets);
      } catch (_) {}
    }

    if (projectId)  allTickets = allTickets.filter(t => t.projectId === projectId || t.projectName === projectId);
    if (status)     allTickets = allTickets.filter(t => t.status === status);
    if (assignedTo) allTickets = allTickets.filter(t => t.assignedTo === assignedTo);

    allTickets.sort((a, b) => Number(b.serialNumber) - Number(a.serialNumber));

    const total = allTickets.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paged = allTickets.slice(start, start + parseInt(limit));

    res.json({
      tickets: paged.map(shapeTicket),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const projects = await readSheet(SHEETS.PROJECTS);
    for (const proj of projects) {
      const tickets = await readSheet(proj.projectName);
      const ticket  = tickets.find(t => t.id === req.params.id);
      if (ticket) return res.json(shapeTicket(ticket));
    }
    res.status(404).json({ error: 'Ticket not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const errors = validateBody(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { projectId, incidentStartTime, incidentEndTime, issue, assignedTo,
      systemsImpacted, businessCriticality, rca, interfaceName, executionId, fixesDetails, status } = req.body;

    if (!projectId) return res.status(400).json({ errors: ['Project ID is required'] });
    if (!incidentStartTime || !isValidDateTime(incidentStartTime))
      return res.status(400).json({ errors: ['Incident Start Time is required (YYYY-MM-DD HH:mm:ss)'] });

    const projectName    = await getProjectName(projectId);
    const assignedToName = await getTechnicianName(assignedTo);

    if (!projectName) return res.status(400).json({ errors: ['Project not found'] });

    await ensureSheet(projectName, HEADERS.TICKET);

    const existing     = await readSheet(projectName);
    const serialNumber = existing.length + 1;
    const now          = nowIST();

    const ticket = {
      id:                 makeTicketId(),
      serialNumber:       String(serialNumber),
      projectId:          projectName,
      projectName,
      executionId:        executionId.trim(),
      incidentStartTime,
      incidentEndTime:    incidentEndTime || '',
      issue:              issue.trim(),
      assignedTo,
      assignedToName,
      systemsImpacted:    systemsImpacted || '',
      businessCriticality,
      rca:                rca || '',
      interfaceName:      interfaceName || '',
      fixesDetails:       fixesDetails || '',
      status:             status || 'Open',
      lastUpdatedBy:      req.session.username,
      lastUpdatedAt:      now,
      createdAt:          now,
    };

    await appendRow(projectName, HEADERS.TICKET, ticket);
    res.status(201).json(shapeTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const errors = validateBody(req.body, true);
    if (errors.length) return res.status(400).json({ errors });

    const projects = await readSheet(SHEETS.PROJECTS);

    for (const proj of projects) {
      const tickets = await readSheet(proj.projectName);
      const ticket  = tickets.find(t => t.id === req.params.id);

      if (ticket) {
        const assignedToName = req.body.assignedTo
          ? await getTechnicianName(req.body.assignedTo)
          : ticket.assignedToName;

        const updated = {
          ...ticket,
          ...req.body,
          projectId:     ticket.projectId,
          projectName:   ticket.projectName,
          assignedToName,
          lastUpdatedBy: req.session.username,
          lastUpdatedAt: nowIST(),
        };

        await updateRow(proj.projectName, HEADERS.TICKET, req.params.id, updated);
        return res.json(shapeTicket(updated));
      }
    }
    res.status(404).json({ error: 'Ticket not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const projects = await readSheet(SHEETS.PROJECTS);
    for (const proj of projects) {
      const deleted = await deleteRow(proj.projectName, req.params.id);
      if (deleted) return res.json({ message: 'Ticket deleted successfully' });
    }
    res.status(404).json({ error: 'Ticket not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;