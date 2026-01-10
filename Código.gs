
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE v6.0
 * Organização automática em abas sem nenhuma formatação.
 */

const CONFIG = {
  'JOGADORES': ['ID', 'NOME', 'POSICAO', 'GOLS', 'ASSISTENCIAS', 'JOGOS', 'AMARELOS', 'VERMELHOS', 'WHATSAPP', 'ATIVO'],
  'SÚMULAS': ['ID', 'DATA', 'ADVERSARIO', 'QUADRO', 'TECNICO', 'AMISTOSO', 'WO', 'NOTAS', 'ESTATISTICAS_JSON', 'ELENCO_JSON', 'AVALIACOES_JSON'],
  'DESPESAS': ['ID', 'DATA', 'DESCRICAO', 'VALOR', 'CATEGORIA'],
  'MENSALIDADES': ['PLAYER_ID', 'MES', 'STATUS', 'VALOR'],
  'REGRAS_CARTOLA': ['ID', 'LABEL', 'CATEGORIA', 'VALOR', 'ATIVO', 'TIPO']
};

/**
 * Cria ou recupera uma aba sem nenhuma cor ou estilo.
 */
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  const headers = CONFIG[name];
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function doGet() {
  const result = {
    PLAYERS: [],
    MATCHES: [],
    EXPENSES: [],
    PAYMENTS: [],
    RULES: []
  };

  const parseJSON = (val) => {
    try { return val ? JSON.parse(val) : null; } catch (e) { return null; }
  };

  // 1. JOGADORES
  const sheetPlayers = getOrCreateSheet('JOGADORES');
  const dataPlayers = sheetPlayers.getDataRange().getValues().slice(1);
  dataPlayers.forEach(row => {
    if (!row[0]) return;
    result.PLAYERS.push({
      id: row[0].toString(), name: row[1], position: row[2], goals: Number(row[3]) || 0, assists: Number(row[4]) || 0,
      matchesPlayed: Number(row[5]) || 0, yellowCards: Number(row[6]) || 0, redCards: Number(row[7]) || 0, whatsapp: row[8],
      active: row[9] !== 'Não'
    });
  });

  // 2. SÚMULAS
  const sheetMatches = getOrCreateSheet('SÚMULAS');
  const dataMatches = sheetMatches.getDataRange().getValues().slice(1);
  dataMatches.forEach(row => {
    if (!row[0]) return;
    result.MATCHES.push({
      id: row[0].toString(), 
      date: row[1] instanceof Date ? row[1].toISOString().split('T')[0] : row[1],
      opponent: row[2], label: row[3], coach: row[4], isFriendly: row[5] === true,
      wo: row[6], notes: row[7], stats: parseJSON(row[8]), roster: parseJSON(row[9]),
      playerRatings: parseJSON(row[10])
    });
  });

  // 3. DESPESAS
  const sheetExpenses = getOrCreateSheet('DESPESAS');
  const dataExpenses = sheetExpenses.getDataRange().getValues().slice(1);
  dataExpenses.forEach(row => {
    if (!row[0]) return;
    result.EXPENSES.push({
      id: row[0].toString(), date: row[1] instanceof Date ? row[1].toISOString().split('T')[0] : row[1],
      description: row[2], value: Number(row[3]) || 0, category: row[4]
    });
  });

  // 4. MENSALIDADES
  const sheetPayments = getOrCreateSheet('MENSALIDADES');
  const dataPayments = sheetPayments.getDataRange().getValues().slice(1);
  dataPayments.forEach(row => {
    if (!row[0]) return;
    result.PAYMENTS.push({
      playerId: row[0].toString(), month: row[1], status: row[2], value: Number(row[3]) || 0
    });
  });

  // 5. REGRAS
  const sheetRules = getOrCreateSheet('REGRAS_CARTOLA');
  const dataRules = sheetRules.getDataRange().getValues().slice(1);
  dataRules.forEach(row => {
    if (!row[0]) return;
    result.RULES.push({
      id: row[0].toString(), label: row[1], category: row[2], value: Number(row[3]) || 0,
      active: row[4] === 'Sim', type: row[5]
    });
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) throw new Error('Servidor ocupado.');
    
    const payload = JSON.parse(e.postData.contents);
    const allData = payload.data;
    
    if (!allData) throw new Error('Dados ausentes.');

    // Atualização JOGADORES
    const sheetP = getOrCreateSheet('JOGADORES');
    const headersP = CONFIG['JOGADORES'];
    if (sheetP.getLastRow() > 1) {
      sheetP.getRange(2, 1, sheetP.getLastRow() - 1, headersP.length).clearContent();
    }
    if (allData.PLAYERS && allData.PLAYERS.length > 0) {
      const rowsP = allData.PLAYERS.map(p => [
        p.id, p.name, p.position, p.goals, p.assists, p.matchesPlayed, 
        p.yellowCards, p.redCards, p.whatsapp, p.active === false ? 'Não' : 'Sim'
      ]);
      sheetP.getRange(2, 1, rowsP.length, headersP.length).setValues(rowsP);
    }

    // Atualização SÚMULAS
    const sheetM = getOrCreateSheet('SÚMULAS');
    const headersM = CONFIG['SÚMULAS'];
    if (sheetM.getLastRow() > 1) {
      sheetM.getRange(2, 1, sheetM.getLastRow() - 1, headersM.length).clearContent();
    }
    if (allData.MATCHES && allData.MATCHES.length > 0) {
      const rowsM = allData.MATCHES.map(m => [
        m.id, m.date, m.opponent, m.label, m.coach, m.isFriendly, m.wo, m.notes,
        JSON.stringify(m.stats), JSON.stringify(m.roster), JSON.stringify(m.playerRatings)
      ]);
      sheetM.getRange(2, 1, rowsM.length, headersM.length).setValues(rowsM);
    }

    // Atualização DESPESAS
    const sheetE = getOrCreateSheet('DESPESAS');
    const headersE = CONFIG['DESPESAS'];
    if (sheetE.getLastRow() > 1) {
      sheetE.getRange(2, 1, sheetE.getLastRow() - 1, headersE.length).clearContent();
    }
    if (allData.EXPENSES && allData.EXPENSES.length > 0) {
      const rowsE = allData.EXPENSES.map(ex => [
        ex.id, ex.date, ex.description, ex.value, ex.category
      ]);
      sheetE.getRange(2, 1, rowsE.length, headersE.length).setValues(rowsE);
    }

    // Atualização MENSALIDADES
    const sheetPay = getOrCreateSheet('MENSALIDADES');
    const headersPay = CONFIG['MENSALIDADES'];
    if (sheetPay.getLastRow() > 1) {
      sheetPay.getRange(2, 1, sheetPay.getLastRow() - 1, headersPay.length).clearContent();
    }
    if (allData.PAYMENTS && allData.PAYMENTS.length > 0) {
      const rowsPay = allData.PAYMENTS.map(py => [
        py.playerId, py.month, py.status, py.value
      ]);
      sheetPay.getRange(2, 1, rowsPay.length, headersPay.length).setValues(rowsPay);
    }

    // Atualização REGRAS
    const sheetR = getOrCreateSheet('REGRAS_CARTOLA');
    const headersR = CONFIG['REGRAS_CARTOLA'];
    if (sheetR.getLastRow() > 1) {
      sheetR.getRange(2, 1, sheetR.getLastRow() - 1, headersR.length).clearContent();
    }
    if (allData.RULES && allData.RULES.length > 0) {
      const rowsR = allData.RULES.map(r => [
        r.id, r.label, r.category, r.value, r.active ? 'Sim' : 'Não', r.type
      ]);
      sheetR.getRange(2, 1, rowsR.length, headersR.length).setValues(rowsR);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally { 
    lock.releaseLock(); 
  }
}
