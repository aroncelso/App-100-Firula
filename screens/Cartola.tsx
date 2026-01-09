import React, { useMemo, useState } from 'react';
import { Match, Player, EventType } from '../types';
import { Trophy, Calendar, Crown, Medal, UserCog } from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
}

const Cartola: React.FC<Props> = ({ matches, players }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
        if (m.date) years.add(m.date.split('-')[0]);
    });
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  // SCORING RULES
  const SCORES = {
    GOAL: {
        'Atacante': 8,
        'Meio-Campo': 5,
        'Zagueiro': 8,
        'Goleiro': 10
    },
    ASSIST: 5,
    DEFESA_PENALTI: 7, // GK only
    GOL_SOFRIDO: -1,   // GK only
    CLEAN_SHEET: 5,    // GK and Zagueiro
    FALTA: -0.5,
    AMARELO: -2,
    VERMELHO: -5,
    PENALTI_PERDIDO: -4,
    PENALTI_SOFRIDO: 1,
    PENALTI_COMETIDO: -1,
    GOL_CONTRA: -5,
    COACH: {
        WIN: 6,
        DRAW: 3,
        LOSS: 0
    }
  };

  const calculateCartolaStats = (player: Player) => {
      let totalPoints = 0;
      let matchesCount = 0;

      matches.forEach(match => {
          // Filter by Year
          if (!match.date || match.date.split('-')[0] !== selectedYear) return;
          if (match.isFriendly) return; // Usually fantasy leagues don't count friendlies, assuming this.
          
          let matchPoints = 0;
          let played = false;

          // 1. COACH POINTS
          if (match.coach === player.name) {
             played = true;
             // Determine result based on goals
             const us = match.stats.tempo1.events.filter(e => e.type === 'GOL').length + 
                        match.stats.tempo2.events.filter(e => e.type === 'GOL').length;
             const them = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
             
             if (match.wo === 'win') matchPoints += SCORES.COACH.WIN;
             else if (match.wo === 'loss') matchPoints += SCORES.COACH.LOSS;
             else if (us > them) matchPoints += SCORES.COACH.WIN;
             else if (us === them) matchPoints += SCORES.COACH.DRAW;
             else matchPoints += SCORES.COACH.LOSS;
          }

          // 2. PLAYER POINTS
          if (match.roster?.includes(player.id)) {
              played = true;
              const allEvents = [...match.stats.tempo1.events, ...match.stats.tempo2.events];
              const playerEvents = allEvents.filter(e => e.playerId === player.id);
              
              // Events Scoring
              playerEvents.forEach(e => {
                  switch (e.type) {
                      case 'GOL': 
                          matchPoints += SCORES.GOAL[player.position] || 0; 
                          break;
                      case 'ASSIST': matchPoints += SCORES.ASSIST; break;
                      case 'FALTA': matchPoints += SCORES.FALTA; break;
                      case 'AMARELO': matchPoints += SCORES.AMARELO; break;
                      case 'VERMELHO': matchPoints += SCORES.VERMELHO; break;
                      case 'DEFESA_PENALTI': matchPoints += SCORES.DEFESA_PENALTI; break;
                      case 'GOL_CONTRA': matchPoints += SCORES.GOL_CONTRA; break;
                      case 'PENALTI_PERDIDO': matchPoints += SCORES.PENALTI_PERDIDO; break;
                      case 'PENALTI_SOFRIDO': matchPoints += SCORES.PENALTI_SOFRIDO; break;
                      case 'PENALTI_COMETIDO': matchPoints += SCORES.PENALTI_COMETIDO; break;
                  }
              });

              // Defensive Scoring (Goals Conceded / Clean Sheet)
              const goalsConceded = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
              
              if (player.position === 'Goleiro') {
                  matchPoints += (goalsConceded * SCORES.GOL_SOFRIDO);
                  if (goalsConceded === 0) matchPoints += SCORES.CLEAN_SHEET;
              }

              if (player.position === 'Zagueiro') {
                  if (goalsConceded === 0) matchPoints += SCORES.CLEAN_SHEET;
              }
          }

          if (played) {
              totalPoints += matchPoints;
              matchesCount++;
          }
      });

      return {
          totalPoints,
          matchesCount,
          average: matchesCount > 0 ? (totalPoints / matchesCount).toFixed(1) : '0.0'
      };
  };

  const rankedPlayers = useMemo(() => {
      return players.map(p => ({
          ...p,
          stats: calculateCartolaStats(p)
      }))
      .filter(p => p.stats.matchesCount > 0)
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
  }, [players, matches, selectedYear]);

  return (
    <div className="space-y-6 pb-20">
       <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">CARTOLA</h2>
          <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">Ranking Oficial 100Firula</p>
        </div>
        
        {/* Year Selector */}
        <div className="bg-[#111] rounded-xl p-1 flex gap-1">
             {availableYears.map(year => (
                 <button 
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedYear === year ? 'bg-[#F4BE02] text-black' : 'text-white/40 hover:text-white'}`}
                 >
                     {year}
                 </button>
             ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {rankedPlayers.map((player, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              
              return (
                  <div key={player.id} className="relative group">
                      {/* Rank Number */}
                      <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-xl z-20 border-2
                          ${rank === 1 ? 'bg-[#F4BE02] text-black border-white' : 
                            rank === 2 ? 'bg-[#C0C0C0] text-black border-white' : 
                            rank === 3 ? 'bg-[#CD7F32] text-black border-white' : 
                            'bg-[#111] text-white/50 border-white/10'
                          }`}
                      >
                          {rank}
                      </div>

                      <div className={`bg-[#0A0A0A] p-4 pl-8 rounded-[24px] border transition-all flex items-center justify-between
                          ${isTop3 ? 'border-[#F4BE02]/20 shadow-[0_4px_20px_rgba(244,190,2,0.05)]' : 'border-white/[0.06] hover:border-white/10'}
                      `}>
                           <div className="flex items-center gap-4">
                               <div className="relative">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg border
                                    ${rank === 1 ? 'bg-[#F4BE02]/10 text-[#F4BE02] border-[#F4BE02]/20' : 'bg-white/5 text-white/60 border-white/10'}`}>
                                      {player.name.charAt(0)}
                                  </div>
                                  {rank === 1 && (
                                      <div className="absolute -top-3 -right-2">
                                          <Crown size={16} className="text-[#F4BE02] drop-shadow-lg" fill="currentColor"/>
                                      </div>
                                  )}
                               </div>
                               <div>
                                   <div className="flex items-center gap-2">
                                     <h3 className="font-bold text-sm text-white">{player.name}</h3>
                                     <span className="text-[8px] font-black uppercase tracking-wider text-white/30 px-1.5 py-0.5 rounded bg-white/5">{player.position}</span>
                                   </div>
                                   <div className="flex items-center gap-3 mt-1 text-[9px] text-white/40 font-bold uppercase tracking-wider">
                                       <span>{player.stats.matchesCount} Jogos</span>
                                       <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                       <span className="flex items-center gap-1"><UserCog size={10} /> Técnico</span>
                                   </div>
                               </div>
                           </div>

                           <div className="text-right">
                               <p className="text-2xl font-display font-bold text-[#F4BE02] leading-none">{player.stats.totalPoints.toFixed(1)}</p>
                               <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Média: {player.stats.average}</p>
                           </div>
                      </div>
                  </div>
              )
          })}
          
          {rankedPlayers.length === 0 && (
              <div className="text-center py-20 opacity-20">
                  <Trophy size={48} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma pontuação registrada</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Cartola;