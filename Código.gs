
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE v7.0
 * Organização total em colunas individuais (Sem JSON).
 */

const CONFIG = {
  'JOGADORES': ['ID', 'NOME', 'POSICAO', 'GOLS', 'ASSISTENCIAS', 'JOGOS', 'AMARELOS', 'VERMELHOS', 'WHATSAPP', 'ATIVO'],
  'PARTIDAS': [
    'ID', 'DATA', 'ADVERSARIO', 'QUADRO', 'TECNICO', 'AMISTOSO', 'WO', 'NOTAS', 
    'GOLS_PRO', 'GOLS_CONTRA', 'FALTAS_TIME_T1', 'FALTAS_TIME_T2', 
    'GOLS_ADVERSARIO_T1', 'GOLS_ADVERSARIO_T2', 'FALTAS_ADVERSARIO_T1', 'FALTAS_ADVERSARIO_T2'
  ],
  'LANCAMENTOS_ATLETAS': [
    'ID_PARTIDA', 'ID_ATLETA', 'GOLS', 'ASSISTENCIAS', 'AMARELO', 'VERMELHO', 
    'FALTAS', 'GOL_CONTRA', 'PENALTI_SOFRIDO', 'PENALTI_COMETIDO', 'PENALTI_PERDIDO', 'NOTA'
  ],
  'DESPESAS': ['ID', 'DATA', 'DESCRICAO', 'VALOR', 'CATEGORIA'],
  'MENSALIDADES': ['PLAYER_ID', 'MES', 'STATUS', 'VALOR'],
  'REGRAS_CARTOLA': ['ID', 'LABEL', 'CATEGORIA', 'VALOR', 'ATIVO', 'TIPO']
};

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
    PARTIDAS: [],
    LANCAMENTOS_ATLETAS: [],
    EXPENSES: [],
    PAYMENTS: [],
    RULES: []
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

  // 2. PARTIDAS
  const sheetMatches = getOrCreateSheet('PARTIDAS');
  const dataMatches = sheetMatches.getDataRange().getValues().slice(1);
  dataMatches.forEach(row => {
    if (!row[0]) return;
    result.PARTIDAS.push({
      id: row[0].toString(), 
      data: row[1] instanceof Date ? row[1].toISOString().split('T')[0] : row[1],
      adversario: row[2], quadro: row[3], tecnico: row[4], amistoso: row[5],
      wo: row[6], notas: row[7], golsPro: row[8], golsContra: row[9],
      faltasTimeT1: row[10], faltasTimeT2: row[11],
      golsAdversarioT1: row[12], golsAdversarioT2: row[13],
      faltasAdversarioT1: row[14], faltasAdversarioT2: row[15]
    });
  });

  // 3. LANCAMENTOS_ATLETAS
  const sheetL = getOrCreateSheet('LANCAMENTOS_ATLETAS');
  const dataL = sheetL.getDataRange().getValues().slice(1);
  dataL.forEach(row => {
    if (!row[0]) return;
    result.LANCAMENTOS_ATLETAS.push({
      idPartida: row[0].toString(), idAtleta: row[1].toString(), 
      gols: Number(row[2]) || 0, assists: Number(row[3]) || 0,
      amarelo: Number(row[4]) || 0, vermelho: Number(row[5]) || 0,
      faltas: Number(row[6]) || 0, golContra: Number(row[7]) || 0,
      pSofri: Number(row[8]) || 0, pCometi: Number(row[9]) || 0,
      pPerd: Number(row[10]) || 0, nota: Number(row[11]) || 0
    });
  });

  // 4. DESPESAS
  const sheetExpenses = getOrCreateSheet('DESPESAS');
  const dataExpenses = sheetExpenses.getDataRange().getValues().slice(1);
  dataExpenses.forEach(row => {
    if (!row[0]) return;
    result.EXPENSES.push({
      id: row[0].toString(), date: row[1] instanceof Date ? row[1].toISOString().split('T')[0] : row[1],
      description: row[2], value: Number(row[3]) || 0, category: row[4]
    });
  });

  // 5. MENSALIDADES
  const sheetPayments = getOrCreateSheet('MENSALIDADES');
  const dataPayments = sheetPayments.getDataRange().getValues().slice(1);
  dataPayments.forEach(row => {
    if (!row[0]) return;
    result.PAYMENTS.push({
      playerId: row[0].toString(), month: row[1], status: row[2], value: Number(row[3]) || 0
    });
  });

  // 6. REGRAS
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

    // Função auxiliar para limpar e escrever
    const syncSheet = (name, dataRows) => {
      const sheet = getOrCreateSheet(name);
      const headers = CONFIG[name];
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
      }
      if (dataRows && dataRows.length > 0) {
        sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
      }
    };

    // 1. JOGADORES
    syncSheet('JOGADORES', allData.PLAYERS.map(p => [
      p.id, p.name, p.position, p.goals, p.assists, p.matchesPlayed, 
      p.yellowCards, p.redCards, p.whatsapp, p.active === false ? 'Não' : 'Sim'
    ]));

    // 2. PARTIDAS
    syncSheet('PARTIDAS', allData.PARTIDAS.map(m => [
      m.id, m.data, m.adversario, m.quadro, m.tecnico, m.amistoso, m.wo, m.notas,
      m.golsPro, m.golsContra, m.faltasTimeT1, m.faltasTimeT2,
      m.golsAdversarioT1, m.golsAdversarioT2, m.faltasAdversarioT1, m.faltasAdversarioT2
    ]));

    // 3. LANCAMENTOS_ATLETAS
    syncSheet('LANCAMENTOS_ATLETAS', allData.LANCAMENTOS_ATLETAS.map(l => [
      l.idPartida, l.idAtleta, l.gols, l.assists, l.amarelo, l.vermelho,
      l.faltas, l.golContra, l.pSofri, l.pCometi, l.pPerd, l.nota
    ]));

    // 4. DESPESAS
    syncSheet('DESPESAS', allData.EXPENSES.map(ex => [
      ex.id, ex.date, ex.description, ex.value, ex.category
    ]));

    // 5. MENSALIDADES
    syncSheet('MENSALIDADES', allData.PAYMENTS.map(py => [
      py.playerId, py.month, py.status, py.value
    ]));

    // 6. REGRAS
    syncSheet('REGRAS_CARTOLA', allData.RULES.map(r => [
      r.id, r.label, r.category, r.value, r.active ? 'Sim' : 'Não', r.type
    ]));

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally { 
    lock.releaseLock(); 
  }
}
