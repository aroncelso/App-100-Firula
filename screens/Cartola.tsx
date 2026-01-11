
import React, { useMemo, useState } from 'react';
import { Match, Player, EventType, ScoringRule } from '../types';
import { Trophy, Calendar, Crown, Medal, UserCog, Info, Star, Target, Zap, Shield, ShieldAlert, Square, Ban, Footprints, Flame, AlertCircle, ToggleLeft, ToggleRight, Edit3, ChevronDown, ChevronUp, Activity, Filter, Users } from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  rules: ScoringRule[];
  setRules: React.Dispatch<React.SetStateAction<ScoringRule[]>>;
}

interface BreakdownItem {
  count: number;
  points: number;
  label: string;
  type: 'positive' | 'negative' | 'coach';
}

interface CartolaStats {
  totalPoints: number;
  matchesCount: number;
  average: string;
  breakdown: Record<string, BreakdownItem>;
}

const Cartola: React.FC<Props> = ({ matches, players, rules, setRules }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedQuadro, setSelectedQuadro] = useState<string>('Geral'); // Novo Estado
  const [activeTab, setActiveTab] = useState<'ranking' | 'regras'>('ranking');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

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

  // Helper para buscar o valor de uma regra
  const getRuleValue = (id: string): number => {
    const rule = rules.find(r => r.id === id);
    return rule && rule.active ? rule.value : 0;
  };

  const calculateCartolaStats = (player: Player): CartolaStats => {
      let totalPoints = 0;
      let matchesCount = 0;
      
      // Armazena detalhes: { 'GOAL_FWD': { count: 3, points: 24, label: 'Gol de Atacante' } }
      const breakdown: Record<string, BreakdownItem> = {};

      const track = (ruleId: string) => {
          const rule = rules.find(r => r.id === ruleId);
          if (!rule || !rule.active) return 0;
          
          if (!breakdown[ruleId]) {
              breakdown[ruleId] = { count: 0, points: 0, label: rule.label, type: rule.type };
          }
          breakdown[ruleId].count++;
          breakdown[ruleId].points += rule.value;
          return rule.value;
      };

      matches.forEach(match => {
          // Filtro de Ano
          if (!match.date || String(match.date).split('-')[0] !== selectedYear) return;
          // Filtro de Amistoso (Ignora amistosos no ranking)
          if (match.isFriendly) return;
          // Filtro de Quadro (NOVO)
          if (selectedQuadro !== 'Geral' && match.label !== selectedQuadro) return;
          
          let matchPoints = 0;
          let played = false;

          // 1. COACH POINTS
          if (match.coach === player.name) {
             played = true;
             const us = match.stats.tempo1.events.filter(e => e.type === 'GOL').length + 
                        match.stats.tempo2.events.filter(e => e.type === 'GOL').length;
             const them = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
             
             if (match.wo === 'win') matchPoints += track('COACH_WIN');
             else if (match.wo === 'loss') {} // 0
             else if (us > them) matchPoints += track('COACH_WIN');
             else if (us === them) matchPoints += track('COACH_DRAW');
          }

          // 2. PLAYER POINTS
          if (match.roster?.includes(player.id)) {
              played = true;
              const allEvents = [...match.stats.tempo1.events, ...match.stats.tempo2.events];
              const playerEvents = allEvents.filter(e => e.playerId === player.id);
              
              playerEvents.forEach(e => {
                  switch (e.type) {
                      case 'GOL': 
                        if (player.position === 'Goleiro') matchPoints += track('GOAL_GK');
                        else if (player.position === 'Zagueiro') matchPoints += track('GOAL_DEF');
                        else if (player.position === 'Meio-Campo') matchPoints += track('GOAL_MID');
                        else if (player.position === 'Atacante') matchPoints += track('GOAL_FWD');
                        break;
                      case 'ASSIST': matchPoints += track('ASSIST'); break;
                      case 'FALTA': matchPoints += track('FOUL'); break;
                      case 'AMARELO': matchPoints += track('YELLOW'); break;
                      case 'VERMELHO': matchPoints += track('RED'); break;
                      case 'DEFESA_PENALTI': matchPoints += track('DEF_PENALTY'); break;
                      case 'GOL_CONTRA': matchPoints += track('OWN_GOAL'); break;
                      case 'PENALTI_PERDIDO': matchPoints += track('MISSED_PENALTY'); break;
                  }
              });

              const goalsConceded = (match.stats.tempo1.opponentGoals || 0) + (match.stats.tempo2.opponentGoals || 0);
              if (player.position === 'Goleiro') {
                  for(let i=0; i<goalsConceded; i++) matchPoints += track('GOAL_CONCEDED');
                  if (goalsConceded === 0) matchPoints += track('CLEAN_SHEET');
              }
              if (player.position === 'Zagueiro') {
                  if (goalsConceded === 0) matchPoints += track('CLEAN_SHEET');
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
          average: matchesCount > 0 ? (totalPoints / matchesCount).toFixed(1) : '0.0',
          breakdown
      };
  };

  const rankedPlayers = useMemo(() => {
      return players.map(p => ({
          ...p,
          stats: calculateCartolaStats(p)
      }))
      .filter(p => p.stats.matchesCount > 0)
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
  }, [players, matches, selectedYear, selectedQuadro, rules]);

  const updateRuleValue = (id: string, value: string) => {
    const num = parseFloat(value);
    setRules(prev => prev.map(r => r.id === id ? { ...r, value: isNaN(num) ? 0 : num } : r));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const toggleExpand = (playerId: string) => {
      setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  };

  const getRuleIcon = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('gol') && !l.includes('contra') && !l.includes('sofrido')) return <Target size={12} />;
      if (l.includes('assist')) return <Zap size={12} />;
      if (l.includes('clean') || l.includes('sg')) return <Shield size={12} />;
      if (l.includes('amarelo')) return <Square size={12} fill="currentColor" className="text-yellow-500"/>;
      if (l.includes('vermelho')) return <Square size={12} fill="currentColor" className="text-red-500"/>;
      if (l.includes('falta')) return <AlertCircle size={12} />;
      if (l.includes('técnico')) return <UserCog size={12} />;
      if (l.includes('defesa')) return <Activity size={12} />;
      return <Star size={12} />;
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
              {/* ÁREA DE FILTROS (ANO E QUADRO) */}
              <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Filter size={14} className="text-[#F4BE02]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtros de Ranking</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Seletor de Quadro */}
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setSelectedQuadro('Geral')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedQuadro === 'Geral' ? 'bg-[#F4BE02] text-black shadow-md' : 'text-white/30 hover:text-white'}`}>Geral</button>
                        <button onClick={() => setSelectedQuadro('Quadro 1')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedQuadro === 'Quadro 1' ? 'bg-[#F4BE02] text-black shadow-md' : 'text-white/30 hover:text-white'}`}>Q1</button>
                        <button onClick={() => setSelectedQuadro('Quadro 2')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedQuadro === 'Quadro 2' ? 'bg-[#F4BE02] text-black shadow-md' : 'text-white/30 hover:text-white'}`}>Q2</button>
                    </div>

                    {/* Seletor de Ano */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {availableYears.map(year => (
                            <button 
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex-1 sm:flex-none ${selectedYear === year ? 'bg-white text-black border-white' : 'bg-transparent text-white/30 border-white/10 hover:border-white/30'}`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {rankedPlayers.length > 0 ? rankedPlayers.map((player, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      const playerName = player.name || '';
                      const isExpanded = expandedPlayerId === player.id;
                      const hasDetails = Object.keys(player.stats.breakdown).length > 0;

                      return (
                          <div key={player.id} className="relative group">
                              <div className={`absolute -left-2 top-4 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-xl z-20 border-2 transition-all
                                  ${rank === 1 ? 'bg-[#F4BE02] text-black border-white' : 
                                    rank === 2 ? 'bg-[#C0C0C0] text-black border-white' : 
                                    rank === 3 ? 'bg-[#CD7F32] text-black border-white' : 
                                    'bg-[#111] text-white/50 border-white/10'
                                  }`}
                              >
                                  {rank}
                              </div>
                              <button 
                                onClick={() => toggleExpand(player.id)}
                                className={`w-full bg-[#0A0A0A] p-4 pl-8 rounded-[24px] border transition-all flex flex-col cursor-pointer
                                  ${isTop3 ? 'border-[#F4BE02]/20 shadow-[0_4px_20px_rgba(244,190,2,0.05)]' : 'border-white/[0.06] hover:border-white/10'}
                                  ${isExpanded ? 'bg-white/[0.02]' : ''}
                                `}
                              >
                                   <div className="flex items-center justify-between w-full">
                                       <div className="flex items-center gap-4">
                                           <div className="relative">
                                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg border
                                                ${rank === 1 ? 'bg-[#F4BE02]/10 text-[#F4BE02] border-[#F4BE02]/20' : 'bg-white/5 text-white/60 border-white/10'}`}>
                                                  {playerName.charAt(0) || '?'}
                                              </div>
                                           </div>
                                           <div className="text-left">
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
                                       <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-display font-bold text-[#F4BE02] leading-none">{player.stats.totalPoints.toFixed(1)}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Pontos Totais</p>
                                            </div>
                                            {isExpanded ? <ChevronUp size={16} className="text-white/20"/> : <ChevronDown size={16} className="text-white/20"/>}
                                       </div>
                                   </div>

                                   {/* AREA DE DETALHES EXPANSÍVEL */}
                                   {isExpanded && hasDetails && (
                                       <div className="w-full mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                               {(Object.values(player.stats.breakdown) as BreakdownItem[]).sort((a,b) => b.points - a.points).map((item, idx) => (
                                                   <div key={idx} className="flex items-center justify-between bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.02]">
                                                       <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg ${item.points > 0 ? 'bg-[#F4BE02]/10 text-[#F4BE02]' : 'bg-red-500/10 text-red-500'}`}>
                                                                {getRuleIcon(item.label)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-white/80 leading-tight uppercase">{item.label}</span>
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{item.count}x</span>
                                                            </div>
                                                       </div>
                                                       <span className={`text-xs font-bold font-display ${item.points > 0 ? 'text-[#F4BE02]' : 'text-red-500'}`}>
                                                           {item.points > 0 ? '+' : ''}{item.points}
                                                       </span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   )}
                              </button>
                          </div>
                      )
                  }) : (
                    <div className="py-20 text-center flex flex-col items-center opacity-30">
                        <Users size={48} className="mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum dado encontrado para o filtro</p>
                    </div>
                  )}
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
                        <EditableRegraCard key={rule.id} rule={rule} onValueChange={updateRuleValue} onToggle={toggleRule} />
                      ))}
                  </div>
              </section>
          </div>
      )}
    </div>
  );
};

interface EditableRegraCardProps {
  rule: ScoringRule;
  onValueChange: (id: string, value: string) => void;
  onToggle: (id: string) => void;
}

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
