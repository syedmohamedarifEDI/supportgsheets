const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const SHEETS = {
  USERS:       'Users',
  TECHNICIANS: 'Technicians',
  PROJECTS:    'Projects',
};

const HEADERS = {
  USERS:       ['id', 'username', 'password'],
  TECHNICIANS: ['id', 'name', 'email', 'createdAt'],
  PROJECTS:    ['id', 'projectName', 'createdAt'],
  TICKET:      [
    'id',                  // kept internally for update/delete — hidden from view via column order
    'serialNumber', 'projectName',
    'executionId', 'incidentStartTime', 'incidentEndTime',
    'issue', 'assignedToName',
    'systemsImpacted', 'businessCriticality',
    'rca', 'interfaceName', 'fixesDetails',
    'status', 'lastUpdatedBy', 'lastUpdatedAt', 'createdAt'
  ],
};

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

async function getSheetNames() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return meta.data.sheets.map(s => s.properties.title);
}

async function ensureSheet(sheetName, headers) {
  const sheets = await getSheetsClient();
  const existing = await getSheetNames();

  if (!existing.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
    console.log(`✅ Created sheet: ${sheetName}`);
  }
}

async function readSheet(sheetName) {
  const sheets = await getSheetsClient();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:ZZ`,
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  } catch (err) {
    return [];
  }
}

async function appendRow(sheetName, headers, data) {
  const sheets = await getSheetsClient();
  const row = headers.map(h => data[h] !== undefined ? String(data[h]) : '');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

async function updateRow(sheetName, headers, id, data) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return false;
  const headerRow = rows[0];
  const idColIdx = headerRow.indexOf('id');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idColIdx] === id) {
      const updatedRow = headerRow.map((h, idx) => {
        if (data[h] !== undefined) return String(data[h]);
        return rows[i][idx] || '';
      });
      const rowNum = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [updatedRow] },
      });
      return true;
    }
  }
  return false;
}

async function deleteRow(sheetName, id) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return false;
  const headerRow = rows[0];
  const idColIdx = headerRow.indexOf('id');

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetMeta = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheetMeta) return false;
  const sheetId = sheetMeta.properties.sheetId;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idColIdx] === id) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId, dimension: 'ROWS', startIndex: i, endIndex: i + 1 },
            },
          }],
        },
      });
      return true;
    }
  }
  return false;
}

module.exports = { SHEETS, HEADERS, ensureSheet, readSheet, appendRow, updateRow, deleteRow };