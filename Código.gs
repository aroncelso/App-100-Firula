
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE
 * Versão otimizada para garantir cabeçalhos e persistência.
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
      // Se a planilha estiver vazia, aproveita e coloca o cabeçalho
      if (data.length === 0 || data[0].length === 0) {
        sheet.appendRow(CONFIG.MAPPING[key]);
      }
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
    if (!lock.tryLock(30000)) throw new Error('Servidor ocupado (Timeout de Lock)');

    const payload = JSON.parse(e.postData.contents);
    const { type, data } = payload;
    
    if (!type) throw new Error('Tipo não especificado');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = CONFIG.SHEETS[type];
    if (!sheetName) throw new Error('Tabela desconhecida: ' + type);

    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    const headers = CONFIG.MAPPING[type];
    
    // Limpa a planilha e reinseri o cabeçalho
    sheet.clear();
    sheet.appendRow(headers);

    // Se houver dados, insere as linhas
    if (data && data.length > 0) {
      const rows = data.map(item => {
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
