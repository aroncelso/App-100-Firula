// --- CONFIGURAÇÃO DE MAPEAMENTO ---
// Define como os dados do App (JSON) correspondem às Colunas da Planilha
const CONFIGS = {
  'PLAYERS': {
    sheetName: 'Jogadores',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Nome' },
      { key: 'position', header: 'Posição' },
      { key: 'goals', header: 'Gols' },
      { key: 'assists', header: 'Assistências' },
      { key: 'matchesPlayed', header: 'Jogos' },
      { key: 'yellowCards', header: 'Amarelos' },
      { key: 'redCards', header: 'Vermelhos' }
    ]
  },
  'MATCHES': {
    sheetName: 'Sumulas',
    columns: [
      { key: 'id', header: 'ID Partida' },
      { key: 'date', header: 'Data', type: 'date' },
      { key: 'opponent', header: 'Adversário' },
      { key: 'label', header: 'Quadro' },
      // Colunas visuais (para leitura humana na planilha)
      { key: 'score_display', header: 'Placar (Visual)', type: 'visual' }, 
      { key: 'coach', header: 'Técnico' },
      { key: 'isFriendly', header: 'Amistoso?', type: 'boolean' },
      { key: 'wo', header: 'W.O.' },
      { key: 'notes', header: 'Obs' },
      // Colunas de DADOS (JSONs que o app usa)
      { key: 'stats', header: 'DATA_STATS_JSON' }, 
      { key: 'roster', header: 'DATA_ROSTER_JSON' },
      { key: 'playerRatings', header: 'DATA_RATINGS_JSON' }
    ]
  },
  'EXPENSES': {
    sheetName: 'Despesas',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'date', header: 'Data', type: 'date' },
      { key: 'description', header: 'Descrição' },
      { key: 'category', header: 'Categoria' },
      { key: 'value', header: 'Valor (R$)', type: 'money' }
    ]
  },
  'PAYMENTS': {
    sheetName: 'Mensalidades',
    columns: [
      { key: 'playerId', header: 'ID Jogador' },
      { key: 'month', header: 'Mês Ref' },
      { key: 'status', header: 'Status' },
      { key: 'value', header: 'Valor', type: 'money' }
    ]
  }
};

// --- FUNÇÃO GET (Leitura) ---
function doGet(e) {
  const result = {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ['PLAYERS', 'MATCHES', 'EXPENSES', 'PAYMENTS'].forEach(type => {
    const config = CONFIGS[type];
    const sheet = ss.getSheetByName(config.sheetName);
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0]; // Primeira linha são cabeçalhos
      const rows = data.slice(1); // Resto são dados
      
      result[type] = rows.map(row => {
        const item = {};
        
        config.columns.forEach(col => {
          // Ignora colunas puramente visuais na leitura (score_display)
          if (col.type === 'visual') return;

          const index = headers.indexOf(col.header);
          if (index > -1) {
            let val = row[index];

            // 1. Tratamento de JSON (Stats, Roster, Ratings)
            if (col.header.includes('_JSON')) {
               try {
                 if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                   val = JSON.parse(val);
                 } else {
                   val = null; // JSON inválido ou célula vazia
                 }
               } catch (err) {
                 val = null;
               }
            }

            // 2. Tratamento de Datas (Planilha Date Obj -> String YYYY-MM-DD)
            if (col.type === 'date' && val instanceof Date) {
               // Ajusta fuso horário para garantir a data correta
               const year = val.getFullYear();
               const month = String(val.getMonth() + 1).padStart(2, '0');
               const day = String(val.getDate()).padStart(2, '0');
               val = `${year}-${month}-${day}`;
            }

            // 3. Tratamento de Booleanos (Texto -> Bool)
            if (col.type === 'boolean') {
              val = val === 'Sim';
            }

            // 4. Tratamento de Enum (W.O.)
            if (col.key === 'wo') {
               if (val === 'Vitória') val = 'win';
               else if (val === 'Derrota') val = 'loss';
               else val = 'none';
            }

            // Fallbacks para Arrays vazios se vier null
            if (col.key === 'roster' && !val) val = [];
            if (col.key === 'playerRatings' && !val) val = {};

            item[col.key] = val;
          }
        });

        // Reconstrução de Estrutura Padrão para Matches se JSON falhar
        if (type === 'MATCHES' && (!item.stats || typeof item.stats !== 'object')) {
           item.stats = { 
             tempo1: { fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] }, 
             tempo2: { fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] } 
           };
        }

        return item;
      });
    } else {
      result[type] = [];
    }
  });

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- FUNÇÃO POST (Escrita) ---
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  // Tenta bloquear por 10 seg para evitar conflitos de escrita simultânea
  if (!lock.tryLock(10000)) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Server busy' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Lê o corpo da requisição. Aceita tanto JSON parseado quanto raw string
    const contents = e.postData.contents;
    const json = JSON.parse(contents);
    
    const type = json.type; 
    const data = json.data; // Array de objetos
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = CONFIGS[type];
    
    if (config) {
      processSheet(ss, config, data, type);
      return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Invalid type' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNÇÃO AUXILIAR: PROCESSAR PLANILHA ---
function processSheet(ss, config, data, type) {
  let sheet = ss.getSheetByName(config.sheetName);
  const headers = config.columns.map(c => c.header);
  
  // Se a aba não existe, cria
  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  } else {
    // Garante que os cabeçalhos estão atualizados
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    if (currentHeaders.length < headers.length || currentHeaders[0] === "") {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  // Limpa dados antigos (mantendo cabeçalho)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (!data || data.length === 0) return;

  // Transforma os dados do App em Linhas da Planilha
  const rows = data.map(item => {
    return config.columns.map(col => {
      
      // -- Lógica Especial: Coluna Visual de Placar (MATCHES) --
      if (col.key === 'score_display') {
         if (item.stats) {
            const countG = (half) => half.events ? half.events.filter(ev => ev.type === 'GOL').length : 0;
            const us = countG(item.stats.tempo1) + countG(item.stats.tempo2);
            const them = (item.stats.tempo1.opponentGoals || 0) + (item.stats.tempo2.opponentGoals || 0);
            return `${us} x ${them}`;
         }
         return '-';
      }

      let val = item[col.key];

      // -- Serialização de Objetos Complexos para JSON --
      if (col.header.includes('_JSON')) {
          if (val === undefined || val === null) {
              return col.key === 'roster' || col.key === 'events' ? '[]' : '{}';
          }
          return JSON.stringify(val);
      }

      // -- Formatação de Datas (String App -> Date Planilha) --
      if (col.type === 'date' && val) {
          // input vem YYYY-MM-DD
          const parts = val.split('-'); 
          // Cria data ao meio dia para evitar problemas de fuso -1 dia
          if (parts.length === 3) return new Date(parts[0], parts[1]-1, parts[2], 12, 0, 0);
      }

      // -- Booleanos --
      if (col.type === 'boolean') {
          return val ? 'Sim' : 'Não';
      }

      // -- W.O. --
      if (col.key === 'wo') {
          if (val === 'win') return 'Vitória';
          if (val === 'loss') return 'Derrota';
          return '-';
      }

      return val;
    });
  });

  // Grava em lote (Bulk Write) para performance
  if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}