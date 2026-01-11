
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE v18.0 (WITH PLAYER NAMES)
 * Garante cabeçalhos em Português e inclui NOME ATLETA ao lado do ID.
 */

// CONFIGURAÇÃO DOS CABEÇALHOS (PT-BR OBRIGATÓRIO)
const CONFIG = {
  'JOGADORES': [
    'ID', 'NOME', 'POSIÇÃO', 'GOLS', 'ASSISTÊNCIAS', 'JOGOS', 
    'CARTÕES AMARELOS', 'CARTÕES VERMELHOS', 'WHATSAPP', 'ATIVO'
  ],
  'PARTIDAS': [
    'ID', 'DATA', 'ADVERSÁRIO', 'QUADRO', 'TÉCNICO', 'AMISTOSO', 'WO', 'OBSERVAÇÕES', 
    'GOLS PRÓ', 'GOLS CONTRA', 
    'FALTAS TIME T1', 'FALTAS TIME T2', 
    'GOLS ADVERSÁRIO T1', 'GOLS ADVERSÁRIO T2', 
    'FALTAS ADVERSÁRIO T1', 'FALTAS ADVERSÁRIO T2',
    'ÁRBITRO', 'LOGO RIVAL'
  ],
  // ADICIONADO: NOME ATLETA (Índice 2)
  'LANCAMENTOS_ATLETAS': [
    'ID PARTIDA', 'ID ATLETA', 'NOME ATLETA', 'GOLS', 'ASSISTÊNCIAS', 'AMARELO', 'VERMELHO', 
    'FALTAS', 'GOL CONTRA', 'PÊNALTI SOFRIDO', 'PÊNALTI COMETIDO', 'PÊNALTI PERDIDO', 'NOTA MÉDIA', 'DETALHES_AVALIACAO'
  ],
  'DESPESAS': [
    'ID', 'DATA', 'DESCRIÇÃO', 'VALOR', 'CATEGORIA'
  ],
  // ADICIONADO: NOME ATLETA (Índice 1)
  'MENSALIDADES': [
    'ID ATLETA', 'NOME ATLETA', 'STATUS', 'VALOR', 'DATA PAGAMENTO'
  ],
  'REGRAS_CARTOLA': [
    'ID', 'RÓTULO', 'CATEGORIA', 'VALOR', 'ATIVO', 'TIPO'
  ]
};

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  const headers = CONFIG[name];
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // ATUALIZAÇÃO FORÇADA DE CABEÇALHOS
  if (headers && headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground(null)
         .setBorder(true, true, true, true, null, null);
  }
  return sheet;
}

function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
  var str = val.toString().trim();
  if (str.length > 15 && (str.indexOf("GMT") > -1 || str.indexOf("UTC") > -1 || str.indexOf("T") > -1)) {
     try {
       var d = new Date(str);
       if (!isNaN(d.getTime())) return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
     } catch(e) {}
  }
  return str;
}

function doGet() {
  const result = { PLAYERS: [], PARTIDAS: [], LANCAMENTOS_ATLETAS: [], EXPENSES: [], PAYMENTS: [], RULES: [] };
  try {
    const sheetPlayers = getOrCreateSheet('JOGADORES');
    if (sheetPlayers.getLastRow() > 1) {
      sheetPlayers.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.PLAYERS.push({ id: row[0].toString(), name: row[1], position: row[2], goals: Number(row[3]) || 0, assists: Number(row[4]) || 0, jogos: Number(row[5]) || 0, yellowCards: Number(row[6]) || 0, redCards: Number(row[7]) || 0, whatsapp: row[8], active: row[9] !== 'Não' });
      });
    }

    const sheetMatches = getOrCreateSheet('PARTIDAS');
    if (sheetMatches.getLastRow() > 1) {
      sheetMatches.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.PARTIDAS.push({ id: row[0].toString(), data: formatDate(row[1]), adversario: row[2], quadro: row[3], tecnico: row[4], amistoso: row[5], wo: row[6], notes: row[7], golsPro: row[8], golsContra: row[9], faltasTimeT1: row[10], faltasTimeT2: row[11], golsAdversarioT1: row[12], golsAdversarioT2: row[13], faltasAdversarioT1: row[14], faltasAdversarioT2: row[15], arbitro: row[16], logo: row[17] });
      });
    }

    const sheetL = getOrCreateSheet('LANCAMENTOS_ATLETAS');
    if (sheetL.getLastRow() > 1) {
      sheetL.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        // ÍNDICES AJUSTADOS DEVIDO À NOVA COLUNA 'NOME ATLETA' (row[2])
        result.LANCAMENTOS_ATLETAS.push({ 
            idPartida: row[0].toString(), 
            idAtleta: row[1].toString(),
            // row[2] é o Nome, ignoramos na leitura do app pois o app já tem os nomes via JOGADORES
            gols: Number(row[3]) || 0, 
            assistencias: Number(row[4]) || 0, 
            amarelo: Number(row[5]) || 0, 
            vermelho: Number(row[6]) || 0, 
            faltas: Number(row[7]) || 0, 
            golContra: Number(row[8]) || 0, 
            pSofri: Number(row[9]) || 0, 
            pCometi: Number(row[10]) || 0, 
            pPerd: Number(row[11]) || 0, 
            nota: Number(row[12]) || 0,
            detalhesNota: row[13] ? row[13].toString() : "" 
        });
      });
    }

    const sheetExpenses = getOrCreateSheet('DESPESAS');
    if (sheetExpenses.getLastRow() > 1) {
      sheetExpenses.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.EXPENSES.push({ id: row[0].toString(), data: formatDate(row[1]), description: row[2], value: Number(row[3]) || 0, category: row[4] });
      });
    }

    const sheetPayments = getOrCreateSheet('MENSALIDADES');
    if (sheetPayments.getLastRow() > 1) {
      sheetPayments.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        // ÍNDICES AJUSTADOS DEVIDO À NOVA COLUNA 'NOME ATLETA' (row[1])
        result.PAYMENTS.push({ 
          playerId: row[0].toString(),
          // row[1] é Nome
          status: row[2] ? row[2].toString() : "Pendente", 
          value: Number(row[3]) || 0, 
          paymentDate: formatDate(row[4]) 
        });
      });
    }

    const sheetRules = getOrCreateSheet('REGRAS_CARTOLA');
    if (sheetRules.getLastRow() > 1) {
      sheetRules.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.RULES.push({ id: row[0].toString(), label: row[1], category: row[2], value: Number(row[3]) || 0, active: row[4] === 'Sim', type: row[5] });
      });
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) throw new Error('Servidor ocupado. Tente novamente em alguns segundos.');
    const payload = JSON.parse(e.postData.contents);
    const allData = payload.data;
    
    const syncSheet = (name, dataRows) => {
      const sheet = getOrCreateSheet(name);
      const headers = CONFIG[name];
      
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
      }
      
      if (dataRows && dataRows.length > 0) {
        var cleanedRows = dataRows.map(row => row.map(cell => cell === null || cell === undefined ? "" : cell.toString()));
        sheet.getRange(2, 1, cleanedRows.length, headers.length).setValues(cleanedRows);
      }
    };

    syncSheet('JOGADORES', allData.PLAYERS.map(p => [p.id, p.name, p.position, p.goals, p.assists, p.jogos, p.yellowCards, p.redCards, p.whatsapp, p.active === false ? 'Não' : 'Sim']));
    
    syncSheet('PARTIDAS', allData.PARTIDAS.map(m => [
      m.id, m.data, m.adversario, m.quadro, m.tecnico, m.amistoso, m.wo, m.notes, 
      m.golsPro, m.golsContra, 
      m.faltasTimeT1, m.faltasTimeT2, 
      m.golsAdversarioT1, m.golsAdversarioT2, 
      m.faltasAdversarioT1, m.faltasAdversarioT2, 
      m.arbitro, m.logo
    ]));

    // LANCAMENTOS AGORA INCLUEM NOME (l.nomeAtleta)
    syncSheet('LANCAMENTOS_ATLETAS', allData.LANCAMENTOS_ATLETAS.map(l => [
        l.idPartida, 
        l.idAtleta,
        l.nomeAtleta, // NOVO CAMPO
        l.gols, 
        l.assistencias, 
        l.amarelo, 
        l.vermelho, 
        l.faltas, 
        l.golContra, 
        l.pSofri, 
        l.pCometi, 
        l.pPerd, 
        l.nota, 
        l.detalhesNota 
    ]));

    syncSheet('DESPESAS', allData.EXPENSES.map(ex => [ex.id, ex.date, ex.description, ex.value, ex.category]));
    
    // MENSALIDADES AGORA INCLUEM NOME (py.nomeAtleta)
    syncSheet('MENSALIDADES', allData.PAYMENTS.map(py => [
      py.playerId,
      py.nomeAtleta, // NOVO CAMPO
      py.status, 
      py.value, 
      py.paymentDate || ""
    ]));
    
    syncSheet('REGRAS_CARTOLA', allData.RULES.map(r => [r.id, r.label, r.category, r.value, r.active ? 'Sim' : 'Não', r.type]));

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally { lock.releaseLock(); }
}
