
import React, { useMemo, useState } from 'react';
import { Player, Match, HalfStats } from '../types';
import { Trophy, Target, TrendingUp, ChevronRight, Shield, Flame, Footprints, Square, ShieldAlert, Filter } from 'lucide-react';

interface Props {
  players: Player[];
  matches: Match[];
}

const countGoals = (half: HalfStats) => half.events.filter(e => e.type === 'GOL').length;

const Dashboard: React.FC<Props> = ({ players, matches }) => {
  const currentYear = new Date().getFullYear().toString();
  
  // --- FILTER STATES ---
  const [selectedYears, setSelectedYears] = useState<string[]>([currentYear]);
  const [selectedQuadros, setSelectedQuadros] = useState<string[]>(['Quadro 1', 'Quadro 2']);

  // Extract available years from matches
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
      if (m.date) {
        const dateStr = String(m.date);
        if (dateStr.includes('-')) {
          years.add(dateStr.split('-')[0]);
        }
      }
    });
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  // --- FILTERING LOGIC ---
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const dateStr = m.date ? String(m.date) : '';
      const matchYear = dateStr.includes('-') ? dateStr.split('-')[0] : '';
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(matchYear);
      const quadroMatch = selectedQuadros.length === 0 || selectedQuadros.includes(m.label);
      return yearMatch && quadroMatch;
    });
  }, [matches, selectedYears, selectedQuadros]);

  // --- LAST ROUND LOGIC (SHOW BOTH MATCHES) ---
  const lastRoundMatches = useMemo(() => {
    if (filteredMatches.length === 0) return [];
    const lastDate = filteredMatches[filteredMatches.length - 1].date;
    return matches
        .filter(m => m.date === lastDate)
        .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredMatches, matches]);

  // --- 1. TEAM STATS CALCULATION ---
  const teamStats = useMemo(() => {
    let stats = {
      wins: 0, draws: 0, losses: 0, wo: 0, goalsPro: 0, goalsConceded: 0, totalFouls: 0, totalYellow: 0, totalRed: 0
    };

    filteredMatches.forEach(m => {
      const goalsUs = countGoals(m.stats.tempo1) + countGoals(m.stats.tempo2);
      const goalsThem = (m.stats.tempo1.opponentGoals || 0) + (m.stats.tempo2.opponentGoals || 0);
      
      stats.goalsPro += goalsUs;
      stats.goalsConceded += goalsThem;
      stats.totalFouls += (m.stats.tempo1.fouls || 0) + (m.stats.tempo2.fouls || 0);
      
      const countEvents = (type: string) => 
        m.stats.tempo1.events.filter(e => e.type === type).length + 
        m.stats.tempo2.events.filter(e => e.type === type).length;

      stats.totalYellow += countEvents('AMARELO');
      stats.totalRed += countEvents('VERMELHO');

      if (m.wo === 'win') { stats.wins++; stats.wo++; }
      else if (m.wo === 'loss') { stats.losses++; stats.wo++; }
      else if (!m.isFriendly) {
        if (goalsUs > goalsThem) stats.wins++;
        else if (goalsUs === goalsThem) stats.draws++;
        else stats.losses++;
      }
    });
    return stats;
  }, [filteredMatches]);

  // --- 2. PLAYER STATS CALCULATION ---
  const playerStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; goals: number; assists: number; matches: number; fouls: number; yellow: number; red: number }>();
    players.forEach(p => map.set(p.id, { id: p.id, name: p.name, goals: 0, assists: 0, matches: 0, fouls: 0, yellow: 0, red: 0 }));

    filteredMatches.forEach(m => {
       players.forEach(p => {
          const inRoster = m.roster?.includes(p.id);
          const hasEvent = [...m.stats.tempo1.events, ...m.stats.tempo2.events].some(e => e.playerId === p.id);
          const hasRating = m.playerRatings && m.playerRatings[p.id] !== undefined;
          if (inRoster || hasEvent || hasRating) {
             const curr = map.get(p.id);
             if (curr) curr.matches++;
          }
       });
       const allEvents = [...m.stats.tempo1.events, ...m.stats.tempo2.events];
       allEvents.forEach(e => {
          const curr = map.get(e.playerId);
          if (curr) {
             if (e.type === 'GOL') curr.goals++;
             if (e.type === 'ASSIST') curr.assists++;
             if (e.type === 'FALTA') curr.fouls++;
             if (e.type === 'AMARELO') curr.yellow++;
             if (e.type === 'VERMELHO') curr.red++;
          }
       });
    });
    return Array.from(map.values());
  }, [filteredMatches, players]);

  const topScorer = [...playerStats].sort((a, b) => b.goals - a.goals)[0];
  const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists)[0];
  const mostMatches = [...playerStats].sort((a, b) => b.matches - a.matches)[0];
  const mostFouls = [...playerStats].sort((a, b) => b.fouls - a.fouls)[0];
  const mostYellow = [...playerStats].sort((a, b) => b.yellow - a.yellow)[0];
  const mostRed = [...playerStats].sort((a, b) => b.red - a.red)[0];

  const getLastMatchScore = (m: Match) => {
    const home = countGoals(m.stats.tempo1) + countGoals(m.stats.tempo2);
    const away = (m.stats.tempo1.opponentGoals || 0) + (m.stats.tempo2.opponentGoals || 0);
    return { home, away }; 
  };

  const toggleFilter = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) { if (list.length > 1) setter(list.filter(i => i !== item)); }
    else { setter([...list, item]); }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* --- FILTERS SECTION --- */}
      <section className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-1 px-1">
          <Filter size={14} className="text-[#F4BE02]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtros de Visão</h3>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {availableYears.map(year => (
              <button key={year} onClick={() => toggleFilter(selectedYears, year, setSelectedYears)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedYears.includes(year) ? 'bg-[#F4BE02] text-black border-[#F4BE02] shadow-[0_4px_12px_rgba(244,190,2,0.2)]' : 'bg-white/5 text-white/40 border-white/5'}`}>{year}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['Quadro 1', 'Quadro 2'].map(q => (
              <button key={q} onClick={() => toggleFilter(selectedQuadros, q, setSelectedQuadros)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedQuadros.includes(q) ? 'bg-white text-black border-white shadow-[0_4px_12px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/40 border-white/5'}`}>{q}</button>
            ))}
          </div>
        </div>
      </section>

      {/* --- HERO SECTION --- */}
      <div className="relative group overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border border-white/[0.08] shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F4BE02]/5 rounded-full blur-[40px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4BE02] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F4BE02]/80">Resumo Filtrado</span>
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-6">Painel de <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4BE02] to-[#FFD700]">Estatísticas</span></h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-green-500">{teamStats.wins}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-green-500/60">Vitórias</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-white">{teamStats.draws}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Empates</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-red-500">{teamStats.losses}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-500/60">Derrotas</span>
              </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
             <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.05] flex flex-col items-center">
                <span className="text-xl font-display font-bold text-white">{teamStats.goalsPro}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-white/30">Gols Pró</span>
             </div>
             <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.05] flex flex-col items-center">
                <span className="text-xl font-display font-bold text-white">{teamStats.goalsConceded}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-white/30">Gols Sofridos</span>
             </div>
             <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.05] flex flex-col items-center">
                <span className="text-xl font-display font-bold text-white">{teamStats.wo}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-white/30">W.O.</span>
             </div>
          </div>
        </div>
      </div>

      {/* --- LAST ROUND SECTION (BOTH MATCHES) --- */}
      {lastRoundMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">
                Última Rodada ({String(lastRoundMatches[0].date).split('-').reverse().join('/')})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
             {lastRoundMatches.map(match => {
                 const score = getLastMatchScore(match);
                 return (
                    <div key={match.id} className="bg-[#0A0A0A] rounded-[24px] border border-white/[0.06] p-5 flex flex-col gap-6 relative overflow-hidden">
                        {/* Quadro Badge - Agora no topo central, sem sobrepor */}
                        <div className="flex justify-center">
                            <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full backdrop-blur-md">
                                <span className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">{match.label}</span>
                            </div>
                        </div>

                        {/* Confronto Section */}
                        <div className="flex items-center justify-between gap-2 px-1">
                            {/* Time 100 Firula */}
                            <div className="flex flex-col items-center gap-2 w-24 text-center shrink-0">
                                <div className="w-14 h-14 rounded-full bg-black border border-[#F4BE02]/30 flex items-center justify-center p-2 shadow-xl">
                                    <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-full h-full rounded-full opacity-80" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-tight truncate w-full">100 Firula</p>
                            </div>

                            {/* Score Area */}
                            <div className="flex flex-col items-center flex-1 min-w-[80px]">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-display font-bold text-white">{score.home}</span>
                                    <div className="h-6 w-[1px] bg-white/10 rotate-12"></div>
                                    <span className="text-4xl font-display font-bold text-white/30">{score.away}</span>
                                </div>
                            </div>

                            {/* Time Rival */}
                            <div className="flex flex-col items-center gap-2 w-24 text-center shrink-0">
                                <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shadow-xl overflow-hidden p-1">
                                    {match.opponentLogo ? (
                                        <img src={match.opponentLogo} className="w-full h-full object-contain" />
                                    ) : (
                                        <Trophy size={20} className="text-white/10" />
                                    )}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-tight truncate w-full opacity-40">Oponente</p>
                            </div>
                        </div>

                        {/* Adversário Name Pill - Agora mais seguro embaixo do confronto */}
                        <div className="flex justify-center">
                            <div className="px-4 py-1.5 rounded-full bg-[#F4BE02] border border-black/10 shadow-lg shadow-yellow-500/5 max-w-[80%]">
                                <p className="text-[10px] font-black text-black uppercase tracking-widest truncate text-center">
                                    {match.opponent || 'Adversário'}
                                </p>
                            </div>
                        </div>
                    </div>
                 )
             })}
          </div>
        </section>
      )}

      {/* --- DISCIPLINE SUMMARY --- */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <Shield size={14} className="text-[#F4BE02]"/>
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Disciplina do Filtro</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <ShieldAlert size={18} className="text-red-400" />
                 <span className="text-xl font-display font-bold">{teamStats.totalFouls}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Faltas</span>
             </div>
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <Square size={18} className="text-yellow-500" fill="currentColor" />
                 <span className="text-xl font-display font-bold">{teamStats.totalYellow}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Amarelos</span>
             </div>
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <Square size={18} className="text-red-600" fill="currentColor" />
                 <span className="text-xl font-display font-bold">{teamStats.totalRed}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Vermelhos</span>
             </div>
          </div>
      </section>

      {/* --- INDIVIDUAL HIGHLIGHTS --- */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <Flame size={14} className="text-[#F4BE02]"/>
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Destaques do Filtro</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Target size={18}/>} label="Artilheiro" value={topScorer?.goals > 0 ? topScorer.name : '-'} subValue={`${topScorer?.goals || 0} Gols`} color="#F4BE02" />
            <StatCard icon={<TrendingUp size={18}/>} label="Líder Assis." value={topAssists?.assists > 0 ? topAssists.name : '-'} subValue={`${topAssists?.assists || 0} Passes`} color="#3b82f6" />
            <StatCard icon={<Footprints size={18}/>} label="Mais Jogos" value={mostMatches?.matches > 0 ? mostMatches.name : '-'} subValue={`${mostMatches?.matches || 0} Partidas`} color="#10b981" />
            <StatCard icon={<ShieldAlert size={18}/>} label="Mais Faltas" value={mostFouls?.fouls > 0 ? mostFouls.name : '-'} subValue={`${mostFouls?.fouls || 0} Cometidas`} color="#ef4444" />
            <StatCard icon={<Square size={18} fill="currentColor"/>} label="Rei do Amarelo" value={mostYellow?.yellow > 0 ? mostYellow.name : '-'} subValue={`${mostYellow?.yellow || 0} Cartões`} color="#eab308" />
            <StatCard icon={<Square size={18} fill="currentColor"/>} label="Expulsões" value={mostRed?.red > 0 ? mostRed.name : '-'} subValue={`${mostRed?.red || 0} Vermelhos`} color="#dc2626" />
          </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color }: any) => (
  <div className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-2">
        <div className="p-2 rounded-xl bg-white/[0.03]" style={{ color }}>{icon}</div>
        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">{label}</p>
    </div>
    <div>
        <p className="text-xs font-bold truncate leading-tight mb-0.5">{value}</p>
        <p className="text-[9px] font-medium text-white/50">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;
