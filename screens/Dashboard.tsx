import React, { useMemo } from 'react';
import { Player, Match, HalfStats } from '../types';
import { Trophy, Target, TrendingUp, Calendar, ChevronRight, Shield, Flag, AlertTriangle, UserMinus, Flame, Footprints, Square, ShieldAlert } from 'lucide-react';

interface Props {
  players: Player[];
  matches: Match[];
}

const countGoals = (half: HalfStats) => half.events.filter(e => e.type === 'GOL').length;

const Dashboard: React.FC<Props> = ({ players, matches }) => {
  const lastMatch = matches[matches.length - 1];

  // --- 1. TEAM STATS CALCULATION ---
  const teamStats = useMemo(() => {
    let stats = {
      wins: 0,
      draws: 0,
      losses: 0,
      wo: 0,
      goalsPro: 0,
      goalsConceded: 0,
      totalFouls: 0,
      totalYellow: 0,
      totalRed: 0
    };

    matches.forEach(m => {
      // Goals
      const goalsUs = countGoals(m.stats.tempo1) + countGoals(m.stats.tempo2);
      const goalsThem = (m.stats.tempo1.opponentGoals || 0) + (m.stats.tempo2.opponentGoals || 0);
      
      stats.goalsPro += goalsUs;
      stats.goalsConceded += goalsThem;

      // Discipline
      stats.totalFouls += (m.stats.tempo1.fouls || 0) + (m.stats.tempo2.fouls || 0);
      
      const countEvents = (type: string) => 
        m.stats.tempo1.events.filter(e => e.type === type).length + 
        m.stats.tempo2.events.filter(e => e.type === type).length;

      stats.totalYellow += countEvents('AMARELO');
      stats.totalRed += countEvents('VERMELHO');

      // Result
      if (m.wo === 'win') {
        stats.wins++;
        stats.wo++;
      } else if (m.wo === 'loss') {
        stats.losses++;
        stats.wo++;
      } else if (!m.isFriendly) {
        if (goalsUs > goalsThem) stats.wins++;
        else if (goalsUs === goalsThem) stats.draws++;
        else stats.losses++;
      }
    });

    return stats;
  }, [matches]);

  // --- 2. PLAYER STATS CALCULATION ---
  const playerStats = useMemo(() => {
    // Helper to initialize map
    const map = new Map<string, { 
      id: string; 
      name: string; 
      goals: number; 
      assists: number; 
      matches: number; 
      fouls: number; 
      yellow: number; 
      red: number 
    }>();

    // Init players
    players.forEach(p => {
      map.set(p.id, { 
        id: p.id, 
        name: p.name, 
        goals: 0, 
        assists: 0, 
        matches: 0, 
        fouls: 0, 
        yellow: 0, 
        red: 0 
      });
    });

    // Iterate matches
    matches.forEach(m => {
       // Check participation (Roster OR Events OR Ratings)
       players.forEach(p => {
          const inRoster = m.roster?.includes(p.id);
          const hasEvent = [...m.stats.tempo1.events, ...m.stats.tempo2.events].some(e => e.playerId === p.id);
          const hasRating = m.playerRatings && m.playerRatings[p.id] !== undefined;

          if (inRoster || hasEvent || hasRating) {
             const curr = map.get(p.id)!;
             curr.matches++;
          }
       });

       // Count Events
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
  }, [matches, players]);

  // Leaders
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

  const lastScore = lastMatch ? getLastMatchScore(lastMatch) : { home: 0, away: 0 };

  return (
    <div className="space-y-8 pb-10">
      {/* --- HERO SECTION --- */}
      <div className="relative group overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border border-white/[0.08] shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F4BE02]/5 rounded-full blur-[40px]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4BE02] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F4BE02]/80">Temporada 2024</span>
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-6">Resumo do <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4BE02] to-[#FFD700]">Desempenho</span></h2>
          
          {/* Main Stats Grid */}
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

      {/* --- LAST MATCH SECTION --- */}
      {lastMatch && (
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Última Súmula</h3>
            <button className="text-[10px] font-bold text-[#F4BE02] flex items-center gap-1 uppercase">Ver Todas <ChevronRight size={12}/></button>
          </div>
          
          <div className="bg-[#0A0A0A] rounded-[24px] border border-white/[0.06] p-6 relative overflow-hidden">
             <div className="absolute top-4 left-0 right-0 flex justify-center">
                 <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                     <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{lastMatch.label}</span>
                 </div>
             </div>

            <div className="flex items-center justify-between relative z-10 mt-4">
              <div className="flex flex-col items-center gap-2 w-20 text-center">
                <div className="w-14 h-14 rounded-full bg-black border border-[#F4BE02]/30 flex items-center justify-center p-2 shadow-xl">
                  <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-full h-full rounded-full opacity-80" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-tight truncate w-full">100 Firula</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-display font-bold text-white">{lastScore.home}</span>
                  <div className="h-6 w-[1px] bg-white/10"></div>
                  <span className="text-4xl font-display font-bold text-white/40">{lastScore.away}</span>
                </div>
                <div className="mt-2 px-3 py-1 rounded-full bg-[#F4BE02]/10 border border-[#F4BE02]/20">
                   <span className="text-[9px] font-black text-[#F4BE02] uppercase tracking-widest">{lastMatch.opponent}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 w-20 text-center">
                <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shadow-xl">
                   <Trophy size={20} className="text-white/10" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-tight truncate w-full opacity-40">Oponente</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- DISCIPLINE SUMMARY --- */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <Shield size={14} className="text-[#F4BE02]"/>
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Disciplina do Time</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <ShieldAlert size={20} className="text-red-400" />
                 <span className="text-2xl font-display font-bold">{teamStats.totalFouls}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Faltas</span>
             </div>
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <Square size={20} className="text-yellow-500" fill="currentColor" />
                 <span className="text-2xl font-display font-bold">{teamStats.totalYellow}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Amarelos</span>
             </div>
             <div className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/[0.06] flex flex-col items-center gap-2">
                 <Square size={20} className="text-red-600" fill="currentColor" />
                 <span className="text-2xl font-display font-bold">{teamStats.totalRed}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Vermelhos</span>
             </div>
          </div>
      </section>

      {/* --- INDIVIDUAL HIGHLIGHTS --- */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <Flame size={14} className="text-[#F4BE02]"/>
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Destaques Individuais</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={<Target size={18}/>} 
              label="Artilheiro" 
              value={topScorer?.goals > 0 ? topScorer.name : '-'} 
              subValue={`${topScorer?.goals || 0} Gols`}
              color="#F4BE02"
            />
            <StatCard 
              icon={<TrendingUp size={18}/>} 
              label="Líder Assis." 
              value={topAssists?.assists > 0 ? topAssists.name : '-'} 
              subValue={`${topAssists?.assists || 0} Passes`}
              color="#3b82f6"
            />
            <StatCard 
              icon={<Footprints size={18}/>} 
              label="Mais Jogos" 
              value={mostMatches?.matches > 0 ? mostMatches.name : '-'} 
              subValue={`${mostMatches?.matches || 0} Partidas`}
              color="#10b981"
            />
            <StatCard 
              icon={<ShieldAlert size={18}/>} 
              label="Mais Faltas" 
              value={mostFouls?.fouls > 0 ? mostFouls.name : '-'} 
              subValue={`${mostFouls?.fouls || 0} Cometidas`}
              color="#ef4444"
            />
            <StatCard 
              icon={<Square size={18} fill="currentColor"/>} 
              label="Rei do Amarelo" 
              value={mostYellow?.yellow > 0 ? mostYellow.name : '-'} 
              subValue={`${mostYellow?.yellow || 0} Cartões`}
              color="#eab308"
            />
            <StatCard 
              icon={<Square size={18} fill="currentColor"/>} 
              label="Expulsões" 
              value={mostRed?.red > 0 ? mostRed.name : '-'} 
              subValue={`${mostRed?.red || 0} Vermelhos`}
              color="#dc2626"
            />
          </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color }: any) => (
  <div className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-2">
        <div className="p-2 rounded-xl bg-white/[0.03]" style={{ color }}>
        {icon}
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">{label}</p>
    </div>
    <div>
        <p className="text-xs font-bold truncate leading-tight mb-0.5">{value}</p>
        <p className="text-[9px] font-medium text-white/50">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;