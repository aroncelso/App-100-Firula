
import { Player, Match, Expense, Payment, ScoringRule, MatchEvent, HalfStats } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbybEcIpaPLqDlHJxrIZSzfCBrD-Ctn9LY7X-3DObkwLTi531p7N2HXRoZrIFgGoJ2VwJg/exec';

export const api = {
  /**
   * Busca todos os dados e reconstrói os objetos complexos a partir das colunas individuais
   */
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Erro na resposta da rede');
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        // Reconstrução das Partidas a partir dos lançamentos individuais
        const matches: Match[] = (data.PARTIDAS || []).map((m: any) => {
          const matchId = m.id.toString();
          
          // Busca os lançamentos deste atleta para esta partida
          const matchLaunchings = (data.LANCAMENTOS_ATLETAS || []).filter((l: any) => l.idPartida.toString() === matchId);
          
          // Reconstrói o roster (elenco)
          const roster = matchLaunchings.map((l: any) => l.idAtleta.toString());
          
          // Reconstrói as avaliações (notas)
          const playerRatings: Record<string, number> = {};
          matchLaunchings.forEach((l: any) => {
            if (l.nota > 0) playerRatings[l.idAtleta.toString()] = l.nota;
          });

          // Reconstrói os eventos (Gols, Assist, etc) para as estatísticas
          const t1Events: MatchEvent[] = [];
          const t2Events: MatchEvent[] = [];

          matchLaunchings.forEach((l: any) => {
            const pid = l.idAtleta.toString();
            // Aqui simplificamos: como o lançamento por atleta é o total do jogo, 
            // distribuímos no T1 para manter a compatibilidade da interface
            for(let i=0; i<l.gols; i++) t1Events.push({ id: `g-${pid}-${i}`, playerId: pid, type: 'GOL' });
            for(let i=0; i<l.assists; i++) t1Events.push({ id: `a-${pid}-${i}`, playerId: pid, type: 'ASSIST' });
            if(l.amarelo > 0) t1Events.push({ id: `ca-${pid}`, playerId: pid, type: 'AMARELO' });
            if(l.vermelho > 0) t1Events.push({ id: `cv-${pid}`, playerId: pid, type: 'VERMELHO' });
            for(let i=0; i<l.faltas; i++) t1Events.push({ id: `f-${pid}-${i}`, playerId: pid, type: 'FALTA' });
            if(l.golContra > 0) t1Events.push({ id: `gc-${pid}`, playerId: pid, type: 'GOL_CONTRA' });
            if(l.pSofri > 0) t1Events.push({ id: `ps-${pid}`, playerId: pid, type: 'PENALTI_SOFRIDO' });
            if(l.pCometi > 0) t1Events.push({ id: `pc-${pid}`, playerId: pid, type: 'PENALTI_COMETIDO' });
            if(l.pPerd > 0) t1Events.push({ id: `pp-${pid}`, playerId: pid, type: 'PENALTI_PERDIDO' });
          });

          return {
            id: matchId,
            date: m.data ? String(m.data) : '',
            opponent: m.adversario,
            label: m.quadro,
            coach: m.tecnico,
            isFriendly: m.amistoso === 'Sim',
            wo: m.wo || 'none',
            notes: m.notes || '',
            roster: roster,
            playerRatings: playerRatings,
            stats: {
              tempo1: {
                fouls: m.faltasTimeT1 || 0,
                opponentGoals: m.golsAdversarioT1 || 0,
                opponentFouls: m.faltasAdversarioT1 || 0,
                events: t1Events
              },
              tempo2: {
                fouls: m.faltasTimeT2 || 0,
                opponentGoals: m.golsAdversarioT2 || 0,
                opponentFouls: m.faltasAdversarioT2 || 0,
                events: t2Events
              }
            }
          };
        });

        return {
          PLAYERS: Array.isArray(data.PLAYERS) ? data.PLAYERS : [],
          MATCHES: matches,
          EXPENSES: Array.isArray(data.EXPENSES) ? data.EXPENSES : [],
          PAYMENTS: Array.isArray(data.PAYMENTS) ? data.PAYMENTS : [],
          RULES: Array.isArray(data.RULES) ? data.RULES : []
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar dados da planilha:", error);
      return null;
    }
  },

  /**
   * Sincroniza convertendo objetos complexos em colunas individuais para a planilha
   */
  async syncAllData(allData: { 
    PLAYERS: Player[], 
    MATCHES: Match[], 
    EXPENSES: Expense[], 
    PAYMENTS: Payment[], 
    RULES: ScoringRule[] 
  }) {
    try {
      // 1. Prepara PARTIDAS (Flat)
      const partidasFlat = allData.MATCHES.map(m => ({
        id: m.id,
        data: m.date,
        adversario: m.opponent,
        quadro: m.label,
        tecnico: m.coach || '',
        amistoso: m.isFriendly ? 'Sim' : 'Não',
        wo: m.wo || 'none',
        notas: m.notes || '',
        // Totais Coletivos
        golsPro: (m.stats.tempo1.events.filter(e => e.type === 'GOL').length) + (m.stats.tempo2.events.filter(e => e.type === 'GOL').length),
        golsContra: (m.stats.tempo1.opponentGoals || 0) + (m.stats.tempo2.opponentGoals || 0),
        faltasTimeT1: m.stats.tempo1.fouls || 0,
        faltasTimeT2: m.stats.tempo2.fouls || 0,
        golsAdversarioT1: m.stats.tempo1.opponentGoals || 0,
        golsAdversarioT2: m.stats.tempo2.opponentGoals || 0,
        faltasAdversarioT1: m.stats.tempo1.opponentFouls || 0,
        faltasAdversarioT2: m.stats.tempo2.opponentFouls || 0
      }));

      // 2. Prepara LANÇAMENTOS POR ATLETA (Flat)
      const lancamentosAtletas: any[] = [];
      allData.MATCHES.forEach(m => {
        const uniquePlayersInMatch = new Set([...(m.roster || []), ...Object.keys(m.playerRatings || {})]);
        
        uniquePlayersInMatch.forEach(pid => {
          const allMatchEvents = [...m.stats.tempo1.events, ...m.stats.tempo2.events].filter(e => e.playerId === pid);
          
          lancamentosAtletas.push({
            idPartida: m.id,
            idAtleta: pid,
            gols: allMatchEvents.filter(e => e.type === 'GOL').length,
            assists: allMatchEvents.filter(e => e.type === 'ASSIST').length,
            amarelo: allMatchEvents.filter(e => e.type === 'AMARELO').length,
            vermelho: allMatchEvents.filter(e => e.type === 'VERMELHO').length,
            faltas: allMatchEvents.filter(e => e.type === 'FALTA').length,
            golContra: allMatchEvents.filter(e => e.type === 'GOL_CONTRA').length,
            pSofri: allMatchEvents.filter(e => e.type === 'PENALTI_SOFRIDO').length,
            pCometi: allMatchEvents.filter(e => e.type === 'PENALTI_COMETIDO').length,
            pPerd: allMatchEvents.filter(e => e.type === 'PENALTI_PERDIDO').length,
            nota: m.playerRatings?.[pid] || 0
          });
        });
      });

      const payload = {
        type: 'SYNC_ALL_CHANNELS',
        data: {
          PLAYERS: allData.PLAYERS,
          PARTIDAS: partidasFlat,
          LANCAMENTOS_ATLETAS: lancamentosAtletas,
          EXPENSES: allData.EXPENSES,
          PAYMENTS: allData.PAYMENTS,
          RULES: allData.RULES
        }
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error(`❌ Erro na sincronização:`, error);
      return false;
    }
  }
};
