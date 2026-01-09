
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE
 * Definitive version for robust data sync.
 */

const CONFIG = {
  SHEETS: {
    PLAYERS: 'Jogadores',
    MATCHES: 'Sumulas',
    EXPENSES: 'Despesas',
    PAYMENTS: 'Mensalidades'
  },
  MAPPING: {
    'PLAYERS': ['id', 'name', 'position', 'goals', 'assists', 'matchesPlayed', 'yellowCards', 'redCards'],
    'EXPENSES': ['id', 'date', 'description', 'category', 'value'],
    'PAYMENTS': ['playerId', 'month', 'status', 'value'],
    'MATCHES': ['id', 'date', 'opponent', 'label', 'coach', 'isFriendly', 'wo', 'notes', 'stats', 'roster', 'playerRatings']
  }
};

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = {};

  Object.keys(CONFIG.SHEETS).forEach(key => {
    const sheetName = CONFIG.SHEETS[key];
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      db[key] = [];
      return;
    }

    const headers = data[0];
    const rows = data.slice(1);
    const mapping = CONFIG.MAPPING[key];

    db[key] = rows.map(row => {
      const obj = {};
      mapping.forEach(field => {
        const index = headers.indexOf(field);
        if (index > -1) {
          let val = row[index];
          
          if (['stats', 'roster', 'playerRatings'].includes(field)) {
            try {
              obj[field] = val ? JSON.parse(val) : (field === 'roster' ? [] : {});
            } catch (err) {
              obj[field] = field === 'roster' ? [] : {};
            }
          } 
          else if (val instanceof Date) {
            obj[field] = val.toISOString().split('T')[0];
          }
          else {
            obj[field] = val;
          }
        }
      });
      return obj;
    });
  });

  return ContentService.createTextOutput(JSON.stringify(db))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) throw new Error('Could not obtain lock (Server Busy)');

    const payload = JSON.parse(e.postData.contents);
    const { type, data } = payload;
    
    if (!type || !Array.isArray(data)) throw new Error('Invalid payload format');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = CONFIG.SHEETS[type];
    if (!sheetName) throw new Error('Unknown data type: ' + type);

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    const headers = CONFIG.MAPPING[type];
    sheet.clear();
    sheet.appendRow(headers);

    if (data.length > 0) {
      // Filter out invalid items before saving
      const validData = data.filter(item => {
        if (type === 'PLAYERS') return item.id && item.name;
        return true;
      });

      if (validData.length > 0) {
        const rows = validData.map(item => {
          return headers.map(header => {
            let val = item[header];
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val === undefined ? "" : val;
          });
        });
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
