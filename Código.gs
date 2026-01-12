
/**
 * 100 FIRULA SOCIETY - DATABASE ENGINE v20.2
 * Alterações:
 * 1. MENSALIDADES: Força coluna 'Referência' como texto puro (prefixo ').
 * 2. Suporte a Receita/Despesa na aba DESPESAS (mapeado pelo App).
 */

// CONFIGURAÇÃO DOS CABEÇALHOS FIXOS
const CONFIG = {
  'JOGADORES': [
    'ID', 'NOME', 'POSIÇÃO', 'GOLS', 'ASSISTÊNCIAS', 'JOGOS', 
    'CARTÕES AMARELOS', 'CARTÕES VERMELHOS', 'WHATSAPP', 'ATIVO', 'TIPO'
  ],
  'PARTIDAS': [
    'ID', 'DATA', 'ADVERSÁRIO', 'QUADRO', 'TÉCNICO', 'AMISTOSO', 'WO', 'OBSERVAÇÕES', 
    'GOLS PRÓ', 'GOLS CONTRA', 
    'FALTAS TIME T1', 'FALTAS TIME T2', 
    'GOLS ADVERSÁRIO T1', 'GOLS ADVERSÁRIO T2', 
    'FALTAS ADVERSÁRIO T1', 'FALTAS ADVERSÁRIO T2',
    'ÁRBITRO', 'LOGO RIVAL'
  ],
  'LANCAMENTOS_ATLETAS': [
    'ID PARTIDA', 'ID ATLETA', 'NOME ATLETA', 'GOLS', 'ASSISTÊNCIAS', 'AMARELO', 'VERMELHO', 
    'FALTAS', 'GOL CONTRA', 'PÊNALTI SOFRIDO', 'PÊNALTI COMETIDO', 'PÊNALTI PERDIDO', 'NOTA MÉDIA', 'DETALHES_AVALIACAO'
  ],
  'DESPESAS': [
    'ID', 'DATA', 'DESCRIÇÃO', 'VALOR', 'CATEGORIA', 'TIPO'
  ],
  'MENSALIDADES': [
    'ID ATLETA', 'NOME ATLETA', 'REFERÊNCIA', 'STATUS', 'VALOR', 'DATA PAGAMENTO'
  ],
  'REGRAS_CARTOLA': [
    'ID', 'RÓTULO', 'CATEGORIA', 'VALOR', 'ATIVO', 'TIPO'
  ]
};

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
  var str = val.toString().trim();
  if (str.length > 10 && (str.indexOf("T") > -1 || str.indexOf("-") > -1)) {
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
    // 1. JOGADORES
    const sheetPlayers = getOrCreateSheet('JOGADORES');
    if (sheetPlayers.getLastRow() > 1) {
      sheetPlayers.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.PLAYERS.push({ 
          id: row[0].toString(), 
          name: row[1], 
          position: row[2], 
          goals: Number(row[3]) || 0, 
          assists: Number(row[4]) || 0, 
          jogos: Number(row[5]) || 0, 
          yellowCards: Number(row[6]) || 0, 
          redCards: Number(row[7]) || 0, 
          whatsapp: row[8], 
          active: row[9] !== 'Não', 
          tipo: row[10] || 'Mensalista'
        });
      });
    }

    // 2. PARTIDAS
    const sheetMatches = getOrCreateSheet('PARTIDAS');
    if (sheetMatches.getLastRow() > 1) {
      sheetMatches.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.PARTIDAS.push({ 
          id: row[0].toString(), 
          data: formatDate(row[1]), 
          adversario: row[2], 
          quadro: row[3], 
          tecnico: row[4], 
          amistoso: row[5], 
          wo: row[6], 
          notes: row[7], 
          golsPro: row[8], 
          golsContra: row[9], 
          faltasTimeT1: row[10], 
          faltasTimeT2: row[11], 
          golsAdversarioT1: row[12], 
          golsAdversarioT2: row[13], 
          faltasAdversarioT1: row[14], 
          faltasAdversarioT2: row[15], 
          arbitro: row[16], 
          logo: row[17] 
        });
      });
    }

    // 3. LANÇAMENTOS (STATS)
    const sheetL = getOrCreateSheet('LANCAMENTOS_ATLETAS');
    if (sheetL.getLastRow() > 1) {
      sheetL.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.LANCAMENTOS_ATLETAS.push({ 
            idPartida: row[0].toString(), 
            idAtleta: row[1].toString(),
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

    // 4. DESPESAS
    const sheetExpenses = getOrCreateSheet('DESPESAS');
    if (sheetExpenses.getLastRow() > 1) {
      sheetExpenses.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        result.EXPENSES.push({ 
          id: row[0].toString(), 
          data: formatDate(row[1]), 
          description: row[2], 
          value: Number(row[3]) || 0, 
          category: row[4],
          tipo: row[5] || 'expense'
        });
      });
    }

    // 5. MENSALIDADES
    const sheetPayments = getOrCreateSheet('MENSALIDADES');
    if (sheetPayments.getLastRow() > 1) {
      sheetPayments.getDataRange().getValues().slice(1).forEach(row => {
        if (!row[0]) return;
        const refRaw = row[2] ? row[2].toString() : "Geral";
        // Remove apóstrofo se existir ao ler de volta
        const ref = refRaw.startsWith("'") ? refRaw.substring(1) : refRaw;
        
        const statusReal = row[3] ? row[3].toString() : "Pendente";
        
        result.PAYMENTS.push({ 
          playerId: row[0].toString(),
          status: `${statusReal} | ${ref}`, 
          value: Number(row[4]) || 0, 
          paymentDate: formatDate(row[5]) 
        });
      });
    }

    // 6. REGRAS
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
    if (!lock.tryLock(30000)) throw new Error('Servidor ocupado.');
    
    const payload = JSON.parse(e.postData.contents);
    const allData = payload.data;
    
    // Função auxiliar para sincronizar
    const syncSheet = (name, dataRows) => {
      const sheet = getOrCreateSheet(name);
      const headers = CONFIG[name];
      
      // 1. SEMPRE Atualiza os cabeçalhos na Linha 1
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBorder(true, true, true, true, null, null);
      }
      
      // 2. Limpa dados antigos (da linha 2 para baixo)
      if (sheet.getLastRow() > 1) {
        sheet.getDataRange().offset(1, 0).clearContent();
      }
      
      // 3. Insere novos dados
      if (dataRows && dataRows.length > 0) {
        var cleanedRows = dataRows.map(row => row.map(cell => cell === null || cell === undefined ? "" : cell.toString()));
        sheet.getRange(2, 1, cleanedRows.length, headers.length).setValues(cleanedRows);
      }
    };

    // 1. JOGADORES
    syncSheet('JOGADORES', allData.PLAYERS.map(p => [
      p.id, p.name, p.position, p.goals, p.assists, p.jogos, p.yellowCards, p.redCards, p.whatsapp, 
      p.active === false ? 'Não' : 'Sim', 
      p.tipo
    ]));
    
    // 2. PARTIDAS
    syncSheet('PARTIDAS', allData.PARTIDAS.map(m => [
      m.id, m.data, m.adversario, m.quadro, m.tecnico, m.amistoso, m.wo, m.notes, 
      m.golsPro, m.golsContra, m.faltasTimeT1, m.faltasTimeT2, m.golsAdversarioT1, m.golsAdversarioT2, m.faltasAdversarioT1, m.faltasAdversarioT2, m.arbitro, m.logo
    ]));

    // 3. LANCAMENTOS_ATLETAS (Dinâmico)
    const sheetL = getOrCreateSheet('LANCAMENTOS_ATLETAS');
    const fixedHeaders = CONFIG['LANCAMENTOS_ATLETAS'];
    const lancamentosData = allData.LANCAMENTOS_ATLETAS || [];

    // Detectar colunas de avaliadores
    let dynamicKeysSet = new Set();
    lancamentosData.forEach(l => {
      if (l._evals) Object.keys(l._evals).forEach(k => dynamicKeysSet.add(k));
    });
    const dynamicHeaders = Array.from(dynamicKeysSet).sort();
    const fullHeaders = [...fixedHeaders, ...dynamicHeaders];

    // SEMPRE Atualiza cabeçalhos dinâmicos
    sheetL.getRange(1, 1, 1, sheetL.getMaxColumns()).clearContent().clearFormat();
    sheetL.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
    sheetL.setFrozenRows(1);
    sheetL.getRange(1, 1, 1, fullHeaders.length).setFontWeight("bold").setBorder(true, true, true, true, null, null);

    if (sheetL.getLastRow() > 1) sheetL.getDataRange().offset(1, 0).clearContent();

    if (lancamentosData.length > 0) {
      const rows = lancamentosData.map(l => {
        const fixedData = [
          l.idPartida, l.idAtleta, l.nomeAtleta, l.gols, l.assistencias, l.amarelo, l.vermelho, 
          l.faltas, l.golContra, l.pSofri, l.pCometi, l.pPerd, l.nota, l.detalhesNota
        ];
        const dynamicData = dynamicHeaders.map(headerKey => (l._evals && l._evals[headerKey] !== undefined) ? l._evals[headerKey].toString().replace('.', ',') : "");
        return [...fixedData, ...dynamicData].map(c => c === null || c === undefined ? "" : c.toString());
      });
      sheetL.getRange(2, 1, rows.length, fullHeaders.length).setValues(rows);
    }

    // 4. DESPESAS (O App agora envia 'Receita' ou 'Despesa' no campo tipo)
    syncSheet('DESPESAS', allData.EXPENSES.map(ex => [
      ex.id, ex.date, ex.description, ex.value, ex.category, ex.type
    ]));
    
    // 5. MENSALIDADES
    syncSheet('MENSALIDADES', allData.PAYMENTS.map(py => {
      const rawStatus = py.status || "";
      const parts = rawStatus.split('|');
      const realStatus = parts[0] ? parts[0].trim() : "Pendente";
      const reference = parts[1] ? parts[1].trim() : "Geral";
      
      // Força a referência ser texto adicionando ' (Ex: 'Janeiro / 2026)
      // Isso impede que o Sheets formate como data.
      const forcedTextReference = "'" + reference;

      return [
        py.playerId, 
        py.nomeAtleta, 
        forcedTextReference, 
        realStatus, 
        py.value, 
        py.paymentDate || ""
      ];
    }));

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
