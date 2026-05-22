const express = require('express');
const router = express.Router();
const { SHEETS, HEADERS, ensureSheet, readSheet, appendRow } = require('../utils/sheets');
const { requireAuth } = require('../middleware/auth');
const { google } = require('googleapis');

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// GET all projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await readSheet(SHEETS.PROJECTS);
    res.json(projects.reverse().map(p => ({ ...p, _id: p.projectName })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName || !projectName.trim())
      return res.status(400).json({ error: 'Project name is required' });

    const existing = await readSheet(SHEETS.PROJECTS);
    if (existing.find(p => p.projectName.toLowerCase() === projectName.trim().toLowerCase()))
      return res.status(409).json({ error: 'Project name already exists' });

    const project = {
      id: projectName.trim(),
      projectName: projectName.trim(),
      createdAt: new Date().toISOString(),
    };

    await appendRow(SHEETS.PROJECTS, HEADERS.PROJECTS, project);
    await ensureSheet(project.projectName, HEADERS.TICKET);

    res.status(201).json({ ...project, _id: project.projectName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project — match by projectName directly
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const projectName = req.params.id;
    const sheets = await getSheetsClient();
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.PROJECTS}!A1:ZZ`,
    });

    const rows = res2.data.values || [];
    if (rows.length < 2) return res.status(404).json({ error: 'Project not found' });

    const headerRow = rows[0];
    const nameColIdx = headerRow.indexOf('projectName');

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const projectsSheetMeta = meta.data.sheets.find(s => s.properties.title === SHEETS.PROJECTS);
    if (!projectsSheetMeta) return res.status(404).json({ error: 'Projects sheet not found' });
    const projectsSheetId = projectsSheetMeta.properties.sheetId;

    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][nameColIdx] || '').trim() === projectName.trim()) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) return res.status(404).json({ error: 'Project not found' });

    // Delete the row from Projects sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: projectsSheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });

    // Also delete the project's own ticket sheet if it exists
    const projectTicketSheet = meta.data.sheets.find(s => s.properties.title === projectName.trim());
    if (projectTicketSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteSheet: { sheetId: projectTicketSheet.properties.sheetId },
          }],
        },
      });
    }

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;