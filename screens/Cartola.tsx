import React, { useMemo, useState } from 'react';
import { Match, Player, EventType, ScoringRule } from '../types';
import { Trophy, Calendar, Crown, Medal, UserCog, Info, Star, Target, Zap, Shield, ShieldAlert, Square, Ban, Footprints, Flame, AlertCircle, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  rules: ScoringRule[];
  setRules: React.Dispatch<React.SetStateAction<ScoringRule[]>>;
}

const Cartola: React.FC<Props> = ({ matches, players, rules, setRules }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [activeTab, setActiveTab] = useState<'ranking' | 'regras'>('ranking');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
        if (m.date) years.add(m.date.split('-')[0]);
    });
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  // Helper para buscar o valor de uma regra
  const getRuleValue = (id: string): number => {
    const rule = rules.find(r => r.id === id);
    return rule && rule.active ? rule.value : 0;
  };

  const calculateCartolaStats = (player: Player) => {
      let totalPoints = 0;
      let matchesCount = 0;

      matches.forEach(match => {
          if (!match.date || match.date.split('-')[0] !== selectedYear || match.isFriendly) return;
          
          let matchPoints = 0;
          let played = false;

          // 1. COACH POINTS
          if (match.coach === player.name) {
             played = true;
             const us = match.stats.tempo1.events.filter(e => e.type === 'GOL').length + 
                        match.stats.tempo2.events.filter(e => e.type === 'GOL').length;
             const them = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
             
             if (match.wo === 'win') matchPoints += getRuleValue('COACH_WIN');
             else if (match.wo === 'loss') {} // 0
             else if (us > them) matchPoints += getRuleValue('COACH_WIN');
             else if (us === them) matchPoints += getRuleValue('COACH_DRAW');
          }

          // 2. PLAYER POINTS
          if (match.roster?.includes(player.id)) {
              played = true;
              const allEvents = [...match.stats.tempo1.events, ...match.stats.tempo2.events];
              const playerEvents = allEvents.filter(e => e.playerId === player.id);
              
              playerEvents.forEach(e => {
                  switch (e.type) {
                      case 'GOL': 
                        if (player.position === 'Goleiro') matchPoints += getRuleValue('GOAL_GK');
                        else if (player.position === 'Zagueiro') matchPoints += getRuleValue('GOAL_DEF');
                        else if (player.position === 'Meio-Campo') matchPoints += getRuleValue('GOAL_MID');
                        else if (player.position === 'Atacante') matchPoints += getRuleValue('GOAL_FWD');
                        break;
                      case 'ASSIST': matchPoints += getRuleValue('ASSIST'); break;
                      case 'FALTA': matchPoints += getRuleValue('FOUL'); break;
                      case 'AMARELO': matchPoints += getRuleValue('YELLOW'); break;
                      case 'VERMELHO': matchPoints += getRuleValue('RED'); break;
                      case 'DEFESA_PENALTI': matchPoints += getRuleValue('DEF_PENALTY'); break;
                      case 'GOL_CONTRA': matchPoints += getRuleValue('OWN_GOAL'); break;
                      case 'PENALTI_PERDIDO': matchPoints += getRuleValue('MISSED_PENALTY'); break;
                  }
              });

              const goalsConceded = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
              if (player.position === 'Goleiro') {
                  matchPoints += (goalsConceded * getRuleValue('GOAL_CONCEDED'));
                  if (goalsConceded === 0) matchPoints += getRuleValue('CLEAN_SHEET');
              }
              if (player.position === 'Zagueiro') {
                  if (goalsConceded === 0) matchPoints += getRuleValue('CLEAN_SHEET');
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
  }, [players, matches, selectedYear, rules]);

  const updateRuleValue = (id: string, value: string) => {
    const num = parseFloat(value);
    setRules(prev => prev.map(r => r.id === id ? { ...r, value: isNaN(num) ? 0 : num } : r));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="space-y-6 pb-20">
       <div className="px-1 space-y-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">CARTOLA <span className="text-[#F4BE02]">100FIRULA</span></h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Onde a firula fica de fora</p>
        </div>
        
        <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-2 gap-2">
            <button 
                onClick={() => setActiveTab('ranking')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ranking' ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30'}`}
            >
                <Trophy size={14} /> Ranking
            </button>
            <button 
                onClick={() => setActiveTab('regras')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'regras' ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30'}`}
            >
                <Edit3 size={14} /> Ajustar Regras
            </button>
        </div>
      </div>

      {activeTab === 'ranking' ? (
          <div className="space-y-6">
              <div className="flex justify-end gap-1 px-1">
                {availableYears.map(year => (
                    <button 
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${selectedYear === year ? 'bg-white text-black border-white' : 'text-white/40 border-white/5 hover:text-white'}`}
                    >
                        {year}
                    </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {rankedPlayers.map((player, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      const playerName = player.name || '';
                      return (
                          <div key={player.id} className="relative group">
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
                                              {playerName.charAt(0) || '?'}
                                          </div>
                                       </div>
                                       <div>
                                           <div className="flex items-center gap-2">
                                             <h3 className="font-bold text-sm text-white">{playerName}</h3>
                                             <span className="text-[8px] font-black uppercase tracking-wider text-white/30 px-1.5 py-0.5 rounded bg-white/5">{player.position}</span>
                                           </div>
                                           <div className="flex items-center gap-3 mt-1 text-[9px] text-white/40 font-bold uppercase tracking-wider">
                                               <span>{player.stats.matchesCount} Jogos</span>
                                               <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                               <span className="flex items-center gap-1">Média {player.stats.average}</span>
                                           </div>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <p className="text-2xl font-display font-bold text-[#F4BE02] leading-none">{player.stats.totalPoints.toFixed(1)}</p>
                                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Pontos Totais</p>
                                   </div>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      ) : (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                      <Flame size={18} className="text-[#F4BE02]" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Critérios Positivos</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                      {rules.filter(r => r.type === 'positive').map(rule => (
                        // Fix: explicitly pass key and ensure component type supports it in JSX
                        <EditableRegraCard key={rule.id} rule={rule} onValueChange={updateRuleValue} onToggle={toggleRule} />
                      ))}
                  </div>
              </section>

              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                      <UserCog size={18} className="text-[#F4BE02]" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Bonificações de Técnico</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                      {rules.filter(r => r.type === 'coach').map(rule => (
                        // Fix: explicitly pass key and ensure component type supports it in JSX
                        <EditableRegraCard key={rule.id} rule={rule} onValueChange={updateRuleValue} onToggle={toggleRule} />
                      ))}
                  </div>
              </section>

              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                      <ShieldAlert size={18} className="text-red-500" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Critérios Negativos</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                      {rules.filter(r => r.type === 'negative').map(rule => (
                        // Fix: explicitly pass key and ensure component type supports it in JSX
                        <EditableRegraCard key={rule.id} rule={rule} onValueChange={updateRuleValue} onToggle={toggleRule} />
                      ))}
                  </div>
              </section>
          </div>
      )}
    </div>
  );
};

// Fix: Define explicit interface for sub-component props to allow 'key' and provide better type safety
interface EditableRegraCardProps {
  rule: ScoringRule;
  onValueChange: (id: string, value: string) => void;
  onToggle: (id: string) => void;
}

// Fix: Correctly type the sub-component as React.FC to allow 'key' prop in JSX map iterations
const EditableRegraCard: React.FC<EditableRegraCardProps> = ({ rule, onValueChange, onToggle }) => (
    <div className={`bg-[#0A0A0A] p-4 rounded-2xl border transition-all flex items-center justify-between ${rule.active ? 'border-white/[0.05]' : 'border-red-500/20 opacity-40'}`}>
        <div className="flex items-center gap-3">
            <button onClick={() => onToggle(rule.id)} className="text-[#F4BE02]">
                {rule.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-white/20" />}
            </button>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{rule.label}</span>
                {rule.category && <span className="text-[8px] text-white/30 uppercase font-bold">{rule.category}</span>}
            </div>
        </div>
        
        <div className="relative w-20">
            <input 
                type="number" 
                step="0.5"
                value={rule.value} 
                onChange={(e) => onValueChange(rule.id, e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 w-full text-center font-display font-bold text-sm outline-none focus:border-[#F4BE02]/50 transition-colors"
            />
        </div>
    </div>
);

export default Cartola;
