
import { Player, Match, Expense, Payment, ScoringRule, MatchEvent, HalfStats, RatingDetail } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDg-l1cNY1x-1u-71_jSd-8659UPtHGFQSeXv_tUf6ktC7B7SlRas81dpI7t8a9dZY7w/exec';

const ensureISO = (val: any): string => {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    if (str.length === 10 && str.includes('-')) return str;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
};

const toBRDate = (val: any): string => {
  if (!val) return '';
  let dateObj: Date;
  if (val instanceof Date) {
    dateObj = val;
  } else {
    const str = String(val).trim();
    if (str.includes('/') && str.split('/').length === 3) {
      const p = str.split('/');
      return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
    }
    const p = str.split('-');
    if (p.length === 3 && p[0].length === 4) {
      return `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
    }
    dateObj = new Date(str);
  }
  if (!isNaN(dateObj.getTime())) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val);
};

export const api = {
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Erro na resposta da rede');
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        const matches: Match[] = (data.PARTIDAS || []).map((m: any) => {
          const matchId = m.id.toString();
          const matchLaunchings = (data.LANCAMENTOS_ATLETAS || []).filter((l: any) => l.idPartida.toString() === matchId);
          const roster = matchLaunchings.map((l: any) => l.idAtleta.toString());
          
          const playerRatings: Record<string, number> = {};
          const detailedRatings: Record<string, RatingDetail[]> = {};

          matchLaunchings.forEach((l: any) => { 
            const pid = l.idAtleta.toString();
            
            // Carrega média
            if (l.nota > 0) playerRatings[pid] = Number(l.nota); 
            
            // Carrega detalhes
            try {
                if (l.detalhesNota) {
                    const details = JSON.parse(l.detalhesNota);
                    if (Array.isArray(details)) {
                        detailedRatings[pid] = details;
                    }
                }
            } catch (e) {
                // Silently fail parse
            }
          });

          const t1Events: MatchEvent[] = [];
          const t2Events: MatchEvent[] = [];
          matchLaunchings.forEach((l: any) => {
            const pid = l.idAtleta.toString();
            // AJUSTE: Indices antigos comentados. Os dados vêm via JSON com chaves, então aqui não muda nada se a API retornar objeto. 
            // Se a API retornar array de arrays, precisaria ajustar os índices. 
            // Como o Apps Script retorna JSON com chaves (gols, assistencias...), só precisamos garantir que o Apps Script populou essas chaves corretamente.
            // O Apps Script atualizado popula 'gols' lendo da coluna correta.
            
            const gols = Number(l.gols) || 0;
            const assists = Number(l.assistencias) || 0;
            const am = Number(l.amarelo) || 0;
            const vm = Number(l.vermelho) || 0;
            const ft = Number(l.faltas) || 0;
            const gc = Number(l.golContra) || 0;
            const ps = Number(l.pSofri) || 0;
            const pc = Number(l.pCometi) || 0;
            const pp = Number(l.pPerd) || 0;
            for(let i=0; i<gols; i++) t1Events.push({ id: `g-${pid}-${i}`, playerId: pid, type: 'GOL' });
            for(let i=0; i<assists; i++) t1Events.push({ id: `a-${pid}-${i}`, playerId: pid, type: 'ASSIST' });
            if(am > 0) t1Events.push({ id: `ca-${pid}`, playerId: pid, type: 'AMARELO' });
            if(vm > 0) t1Events.push({ id: `cv-${pid}`, playerId: pid, type: 'VERMELHO' });
            for(let i=0; i<ft; i++) t1Events.push({ id: `f-${pid}-${i}`, playerId: pid, type: 'FALTA' });
            if(gc > 0) t1Events.push({ id: `gc-${pid}`, playerId: pid, type: 'GOL_CONTRA' });
            if(ps > 0) t1Events.push({ id: `ps-${pid}`, playerId: pid, type: 'PENALTI_SOFRIDO' });
            if(pc > 0) t1Events.push({ id: `pc-${pid}`, playerId: pid, type: 'PENALTI_COMETIDO' });
            if(pp > 0) t1Events.push({ id: `pp-${pid}`, playerId: pid, type: 'PENALTI_PERDIDO' });
          });
          return {
            id: matchId, 
            date: ensureISO(m.data), 
            opponent: m.adversario, 
            opponentLogo: m.logo || '', 
            label: m.quadro, 
            coach: m.tecnico, 
            referee: m.arbitro || '', 
            isFriendly: m.amistoso === 'Sim', 
            wo: m.wo || 'none', 
            notes: m.notes || '', 
            roster, 
            playerRatings,
            detailedRatings, 
            stats: {
              tempo1: { fouls: Number(m.faltasTimeT1) || 0, opponentGoals: Number(m.golsAdversarioT1) || 0, opponentFouls: Number(m.faltasAdversarioT1) || 0, events: t1Events },
              tempo2: { fouls: Number(m.faltasTimeT2) || 0, opponentGoals: Number(m.golsAdversarioT2) || 0, opponentFouls: Number(m.faltasAdversarioT2) || 0, events: t2Events }
            }
          };
        });

        return {
          PLAYERS: (data.PLAYERS || []).map((p: any) => ({ ...p, id: p.id.toString(), goals: Number(p.goals) || 0, assists: Number(p.assistencias) || 0, matchesPlayed: Number(p.jogos) || 0, active: p.active !== 'Não' })),
          MATCHES: matches,
          EXPENSES: (data.EXPENSES || []).map((ex: any) => ({ id: ex.id.toString(), description: ex.description || ex.descricao || '', value: Number(ex.value || ex.valor) || 0, date: ensureISO(ex.date || ex.data), category: ex.category || ex.categoria || 'Variável' })),
          
          PAYMENTS: (data.PAYMENTS || []).map((py: any) => {
            const rawStatus = py.status || '';
            const parts = rawStatus.split('|');
            const realStatus = parts[0] ? parts[0].trim() : 'Pendente';
            const monthRef = parts[1] ? parts[1].trim() : 'Geral';
            
            return {
              playerId: py.playerId.toString(),
              month: monthRef, 
              status: realStatus as 'Pago' | 'Pendente',
              value: Number(py.value) || 0,
              paymentDate: ensureISO(py.paymentDate)
            };
          }),
          RULES: Array.isArray(data.RULES) ? data.RULES : []
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      return null;
    }
  },

  async syncAllData(allData: { PLAYERS: Player[], MATCHES: Match[], EXPENSES: Expense[], PAYMENTS: Payment[], RULES: ScoringRule[] }) {
    try {
      // Prepara os dados auxiliares (pagamentos e lançamentos) enriquecidos com o nome do jogador
      const lancamentos: any[] = [];
      
      allData.MATCHES.forEach(m => {
        const uniquePlayers = new Set([...(m.roster || []), ...Object.keys(m.playerRatings || {})]);
        uniquePlayers.forEach(pid => {
          const player = allData.PLAYERS.find(p => p.id === pid);
          const playerName = player ? player.name : 'DESCONHECIDO';
          
          const events = [...m.stats.tempo1.events, ...m.stats.tempo2.events].filter(e => e.playerId === pid);
          
          // Prepara detalhes para JSON
          const details = m.detailedRatings?.[pid] || [];
          const detailsJson = details.length > 0 ? JSON.stringify(details) : "";

          lancamentos.push({ 
              idPartida: m.id, 
              idAtleta: pid,
              nomeAtleta: playerName, // ENVIANDO O NOME
              gols: events.filter(e => e.type === 'GOL').length, 
              assistencias: events.filter(e => e.type === 'ASSIST').length, 
              amarelo: events.filter(e => e.type === 'AMARELO').length, 
              vermelho: events.filter(e => e.type === 'VERMELHO').length, 
              faltas: events.filter(e => e.type === 'FALTA').length, 
              golContra: events.filter(e => e.type === 'GOL_CONTRA').length, 
              pSofri: events.filter(e => e.type === 'PENALTI_SOFRIDO').length, 
              pCometi: events.filter(e => e.type === 'PENALTI_COMETIDO').length, 
              pPerd: events.filter(e => e.type === 'PENALTI_PERDIDO').length, 
              nota: m.playerRatings?.[pid] || 0,
              detalhesNota: detailsJson 
          });
        });
      });

      const pagamentosEnriquecidos = allData.PAYMENTS.map(py => {
          const player = allData.PLAYERS.find(p => p.id === py.playerId);
          return {
            playerId: py.playerId.toString(),
            nomeAtleta: player ? player.name : 'DESCONHECIDO', // ENVIANDO O NOME
            status: `${py.status} | ${py.month}`,
            value: Number(py.value) || 0,
            paymentDate: toBRDate(py.paymentDate)
          };
      });

      const payload = {
        type: 'SYNC_ALL_CHANNELS',
        data: {
          PLAYERS: allData.PLAYERS.map(p => ({ ...p, active: p.active === false ? 'Não' : 'Sim' })),
          PARTIDAS: allData.MATCHES.map(m => ({
            id: m.id, 
            data: toBRDate(m.date), 
            adversario: m.opponent, 
            quadro: m.label, 
            tecnico: m.coach || '', 
            arbitro: m.referee || '', 
            logo: m.opponentLogo || '',
            amistoso: m.isFriendly ? 'Sim' : 'Não', 
            wo: m.wo || 'none', 
            notes: m.notes || '',
            golsPro: (m.stats.tempo1.events.filter(e => e.type === 'GOL').length) + (m.stats.tempo2.events.filter(e => e.type === 'GOL').length),
            golsContra: (Number(m.stats.tempo1.opponentGoals) || 0) + (Number(m.stats.tempo2.opponentGoals) || 0),
            faltasTimeT1: m.stats.tempo1.fouls || 0, faltasTimeT2: m.stats.tempo2.fouls || 0, golsAdversarioT1: m.stats.tempo1.opponentGoals || 0, golsAdversarioT2: m.stats.tempo2.opponentGoals || 0, faltasAdversarioT1: m.stats.tempo1.opponentFouls || 0, faltasAdversarioT2: m.stats.tempo2.opponentFouls || 0
          })),
          LANCAMENTOS_ATLETAS: lancamentos,
          EXPENSES: allData.EXPENSES.map(ex => ({ id: ex.id, date: toBRDate(ex.date), description: ex.description, value: ex.value, category: ex.category })),
          PAYMENTS: pagamentosEnriquecidos,
          RULES: allData.RULES
        }
      };

      const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
      const resData = await response.json();
      return resData.status === 'success';
    } catch (error) {
      console.error(`Erro na sincronização:`, error);
      return false;
    }
  }
};
