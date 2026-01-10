
/**
 * 100 FIRULA SOCIETY - SINGLE DATABASE ENGINE v2.0
 * Gerenciamento centralizado de Súmulas, Financeiro e Atletas.
 */

const SHEET_NAME = 'Banco de Dados 100 Firula';

// Cabeçalhos que mapeiam todas as funcionalidades do App
const HEADERS_MAP = [
  'TIPO', 'IDENTIFICADOR', 'NOME_OU_ADVERSARIO', 'POSICAO_OU_QUADRO', 'GOLS_OU_VALOR', 
  'ASSISTENCIAS_OU_MES', 'PARTIDAS_OU_STATUS', 'CATEGORIA_DESPESA_OU_REGRA', 'VERMELHOS', 
  'DATA_OU_WHATSAPP', 'TECNICO_OU_ATIVO', 'AMISTOSO', 'WO', 'NOTAS', 'ESTATISTICAS_JSON', 
  'ELENCO_JSON', 'AVALIACOES_JSON'
];

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const result = {
    PLAYERS: [],
    MATCHES: [],
    EXPENSES: [],
    PAYMENTS: [],
    RULES: []
  };

  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  const rows = data.slice(1);
  const parseJSON = (val) => {
    try { return val ? JSON.parse(val) : null; } catch (e) { return null; }
  };

  rows.forEach(row => {
    const tipo = row[0];
    if (tipo === 'JOGADOR') {
      result.PLAYERS.push({ 
        id: row[1], 
        name: row[2], 
        position: row[3], 
        goals: row[4] || 0, 
        assists: row[5] || 0, 
        matchesPlayed: row[6] || 0, 
        yellowCards: row[7] || 0, 
        redCards: row[8] || 0,
        whatsapp: row[9] || "",
        active: row[10] !== 'Não'
      });
    } else if (tipo === 'PARTIDA') {
      result.MATCHES.push({ 
        id: row[1], 
        opponent: row[2], 
        label: row[3], 
        date: row[9] instanceof Date ? row[9].toISOString().split('T')[0] : row[9], 
        coach: row[10], 
        isFriendly: row[11], 
        wo: row[12], 
        notes: row[13], 
        stats: parseJSON(row[14]) || { tempo1: {fouls:0, opponentGoals:0, opponentFouls:0, events:[]}, tempo2: {fouls:0, opponentGoals:0, opponentFouls:0, events:[]} }, 
        roster: parseJSON(row[15]) || [], 
        playerRatings: parseJSON(row[16]) || {} 
      });
    } else if (tipo === 'DESPESA') {
      result.EXPENSES.push({ 
        id: row[1], 
        description: row[2], 
        value: row[4], 
        category: row[7], // Fixa / Variável
        date: row[9] instanceof Date ? row[9].toISOString().split('T')[0] : row[9] 
      });
    } else if (tipo === 'MENSALIDADE') {
      result.PAYMENTS.push({ 
        playerId: row[1], 
        value: row[4],
        month: row[5], 
        status: row[6] 
      });
    } else if (tipo === 'REGRA') {
      result.RULES.push({ 
        id: row[1], 
        label: row[2], 
        category: row[3],
        value: parseFloat(row[4]), 
        active: row[6] === 'Sim', 
        type: row[7] 
      });
    }
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) throw new Error('Servidor ocupado. Tente novamente em instantes.');
    
    const payload = JSON.parse(e.postData.contents);
    const allData = payload.data;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    
    sheet.clear();
    sheet.appendRow(HEADERS_MAP);
    
    const rows = [];

    // Mapeamento de JOGADORES
    if (allData.PLAYERS) {
      allData.PLAYERS.forEach(p => {
        const r = Array(HEADERS_MAP.length).fill(""); 
        r[0]='JOGADOR'; r[1]=p.id; r[2]=p.name; r[3]=p.position; r[4]=p.goals; r[5]=p.assists; 
        r[6]=p.matchesPlayed; r[7]=p.yellowCards; r[8]=p.redCards; r[9]=p.whatsapp || "";
        r[10]=p.active === false ? 'Não' : 'Sim';
        rows.push(r);
      });
    }
    
    // Mapeamento de PARTIDAS
    if (allData.MATCHES) {
      allData.MATCHES.forEach(m => {
        const r = Array(HEADERS_MAP.length).fill(""); 
        r[0]='PARTIDA'; r[1]=m.id; r[2]=m.opponent; r[3]=m.label; r[9]=m.date; r[10]=m.coach; 
        r[11]=m.isFriendly; r[12]=m.wo; r[13]=m.notes; r[14]=JSON.stringify(m.stats); 
        r[15]=JSON.stringify(m.roster); r[16]=JSON.stringify(m.playerRatings);
        rows.push(r);
      });
    }
    
    // Mapeamento de DESPESAS (Consulta e Lançamento)
    if (allData.EXPENSES) {
      allData.EXPENSES.forEach(ex => {
        const r = Array(HEADERS_MAP.length).fill(""); 
        r[0]='DESPESA'; r[1]=ex.id; r[2]=ex.description; r[4]=ex.value; r[7]=ex.category; r[9]=ex.date; 
        rows.push(r);
      });
    }
    
    // Mapeamento de MENSALIDADES (Receitas)
    if (allData.PAYMENTS) {
      allData.PAYMENTS.forEach(pay => {
        const r = Array(HEADERS_MAP.length).fill(""); 
        r[0]='MENSALIDADE'; r[1]=pay.playerId; r[4]=pay.value; r[5]=pay.month; r[6]=pay.status; 
        rows.push(r);
      });
    }
    
    // Mapeamento de REGRAS (Cartola)
    if (allData.RULES) {
      allData.RULES.forEach(rule => {
        const r = Array(HEADERS_MAP.length).fill(""); 
        r[0]='REGRA'; r[1]=rule.id; r[2]=rule.label; r[3]=rule.category || ""; r[4]=rule.value; 
        r[6]=rule.active ? 'Sim' : 'Não'; r[7]=rule.type; 
        rows.push(r);
      });
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, HEADERS_MAP.length).setValues(rows);
    }
    
    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally { 
    lock.releaseLock(); 
  }
}
