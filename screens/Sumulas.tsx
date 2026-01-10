
import React, { useState, useMemo } from 'react';
import { Match, Player, EventType, MatchEvent, QuadroStats, HalfStats } from '../types';
import { Plus, X, Calendar, Save, Minus, CheckCircle2, Pencil, Trophy, Star, Crown, Users, Check, Square, ShieldAlert } from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

type QuadroType = 'quadro2' | 'quadro1';

interface FormState {
    id?: string;
    opponent: string;
    date: string;
    notes: string;
    quadro1: QuadroStats;
    quadro2: QuadroStats;
    rosterQ1: string[];
    rosterQ2: string[];
    coach: string;
    editingLabel?: 'Quadro 1' | 'Quadro 2';
    isFriendly: boolean;
    wo: 'none' | 'win' | 'loss';
}

// Added default export and completed truncated component
const Sumulas: React.FC<Props> = ({ matches, players, setMatches }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const [tempRatings, setTempRatings] = useState<Record<string, number>>({});
  const [activeQuadro, setActiveQuadro] = useState<QuadroType>('quadro2');
  const [currentTempo, setCurrentTempo] = useState<1 | 2>(1);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  
  const createEmptyHalf = (): HalfStats => ({ fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] });
  
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [players]);

  const allPlayerIds = useMemo(() => sortedPlayers.map(p => p.id), [sortedPlayers]);

  const [formMatch, setFormMatch] = useState<FormState>({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    quadro1: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
    quadro2: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
    rosterQ1: [],
    rosterQ2: [],
    coach: '',
    isFriendly: false,
    wo: 'none'
  });

  const handleNewMatch = () => {
    setFormMatch({
        opponent: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        quadro1: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
        quadro2: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
        rosterQ1: [],
        rosterQ2: [],
        coach: '',
        isFriendly: false,
        wo: 'none'
    });
    setActiveQuadro('quadro2');
    setSaveSuccess(null);
    setShowForm(true);
  };

  const handleEditMatch = (match: Match) => {
    const isQ1 = match.label === 'Quadro 1';
    setFormMatch({
        id: match.id,
        opponent: match.opponent,
        date: match.date,
        notes: match.notes,
        editingLabel: match.label,
        quadro1: isQ1 ? JSON.parse(JSON.stringify(match.stats)) : { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
        quadro2: !isQ1 ? JSON.parse(JSON.stringify(match.stats)) : { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
        rosterQ1: isQ1 && match.roster ? match.roster : [],
        rosterQ2: !isQ1 && match.roster ? match.roster : [],
        coach: match.coach || '',
        isFriendly: match.isFriendly || false,
        wo: match.wo || 'none'
    });
    setActiveQuadro(isQ1 ? 'quadro1' : 'quadro2');
    setSaveSuccess(null);
    setShowForm(true);
  };

  const togglePlayerInRoster = (playerId: string) => {
      const field = activeQuadro === 'quadro1' ? 'rosterQ1' : 'rosterQ2';
      setFormMatch(prev => {
          const currentList = prev[field];
          if (currentList.includes(playerId)) {
              return { ...prev, [field]: currentList.filter(id => id !== playerId) };
          } else {
              return { ...prev, [field]: [...currentList, playerId] };
          }
      });
  };

  const toggleAllRoster = () => {
      const field = activeQuadro === 'quadro1' ? 'rosterQ1' : 'rosterQ2';
      const isAllSelected = formMatch[field].length === players.length;
      setFormMatch(prev => ({ ...prev, [field]: isAllSelected ? [] : [...allPlayerIds] }));
  };

  const getActiveRoster = () => activeQuadro === 'quadro1' ? formMatch.rosterQ1 : formMatch.rosterQ2;

  const openRatingModal = (match: Match) => {
      setRatingMatchId(match.id);
      setTempRatings(match.playerRatings || {});
  };

  const handleRatePlayer = (playerId: string, delta: number) => {
      setTempRatings(prev => {
          const current = prev[playerId] || 0;
          const newVal = Math.min(10, Math.max(0, current + delta));
          const next = { ...prev };
          if (newVal === 0) delete next[playerId];
          else next[playerId] = newVal;
          return next;
      });
  };

  const saveRatings = () => {
      if (!ratingMatchId) return;
      setMatches(prev => prev.map(m => m.id === ratingMatchId ? { ...m, playerRatings: tempRatings } : m));
      setRatingMatchId(null);
  };

  const getMVP = (match: Match) => {
      if (!match.playerRatings || Object.keys(match.playerRatings).length === 0) return null;
      let maxScore = -1;
      let mvpId = null;
      Object.entries(match.playerRatings).forEach(([pid, score]) => {
          if (score > maxScore) {
              maxScore = score;
              mvpId = pid;
          }
      });
      if (mvpId) {
          return players.find(p => p.id === mvpId)?.name;
      }
      return null;
  };

  const groupedMatches = useMemo(() => {
    const groups: Record<string, { date: string, opponent: string, matches: Match[] }> = {};
    matches.forEach(match => {
        if (!match.date) return;
        const key = `${match.date}_${match.opponent}`;
        if (!groups[key]) groups[key] = { date: match.date, opponent: match.opponent, matches: [] };
        groups[key].matches.push(match);
    });
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches]);

  const calculateScoreAndPoints = (m: Match) => {
     const countG = (h: HalfStats) => h.events.filter(e => e.type === 'GOL').length;
     const us = countG(m.stats.tempo1) + countG(m.stats.tempo2);
     const them = (m.stats.tempo1.opponentGoals||0) + (m.stats.tempo2.opponentGoals||0);
     let points = 0;
     if (m.isFriendly) points = 0;
     else if (m.wo === 'win') points = 3;
     else if (m.wo === 'loss') points = 0;
     else {
         if (us > them) points = 3;
         else if (us === them) points = 1;
         else points = 0;
     }
     return { us, them, points };
  };

  return (
    <div className="space-y-6">
      {ratingMatchId && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-[#0A0A0A] border-t border-white/10 sm:border sm:rounded-[32px] h-[85vh] sm:h-[800px] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-display font-bold text-white">Avaliação</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">Quem jogou muito?</p>
                  </div>
                  <button onClick={() => setRatingMatchId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {sortedPlayers.map(p => {
                     const score = tempRatings[p.id] || 0;
                     return (
                         <div key={p.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${score > 0 ? 'bg-white/[0.03] border-[#F4BE02]/20' : 'bg-transparent border-white/5 opacity-60 hover:opacity-100'}`}>
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-sm">{(p.name || '?').charAt(0)}</div>
                                 <span className="font-bold text-sm">{p.name}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <button onClick={() => handleRatePlayer(p.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"><Minus size={14}/></button>
                                 <div className={`w-8 text-center font-display font-bold text-lg ${score >= 8 ? 'text-[#F4BE02]' : score > 0 ? 'text-white' : 'text-white/20'}`}>{score > 0 ? score : '-'}</div>
                                 <button onClick={() => handleRatePlayer(p.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 active:bg-[#F4BE02] active:text-black transition-colors"><Plus size={14}/></button>
                             </div>
                         </div>
                     )
                 })}
              </div>
              <div className="p-6 border-t border-white/5"><button onClick={saveRatings} className="w-full py-4 bg-[#F4BE02] text-black font-black rounded-2xl uppercase tracking-widest">Confirmar Notas</button></div>
           </div>
        </div>
      )}

      {showRosterModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
           <div className="w-full max-w-md bg-[#0A0A0A] border-t border-white/10 sm:border sm:rounded-[32px] h-[85vh] sm:h-[800px] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-display font-bold text-white">Escalação</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">Quem joga no {activeQuadro === 'quadro1' ? 'Quadro 1' : 'Quadro 2'}?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={toggleAllRoster} className="h-8 px-3 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-black uppercase text-white/40">
                      {getActiveRoster().length === players.length ? 'Limpar' : 'Todos'}
                    </button>
                    <button onClick={() => setShowRosterModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={18}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {sortedPlayers.map(p => {
                     const isSelected = getActiveRoster().includes(p.id);
                     return (
                         <button 
                            key={p.id} 
                            onClick={() => togglePlayerInRoster(p.id)}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isSelected ? 'bg-[#F4BE02]/10 border-[#F4BE02]/20 text-[#F4BE02]' : 'bg-transparent border-white/5 text-white/40'}`}
                         >
                            <span className="font-bold">{p.name}</span>
                            {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                         </button>
                     )
                 })}
              </div>
              <div className="p-6 border-t border-white/5">
                  <button onClick={() => setShowRosterModal(false)} className="w-full py-4 bg-[#F4BE02] text-black font-black rounded-2xl uppercase tracking-widest">Concluir</button>
              </div>
           </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-display font-bold">SÚMULAS</h2>
          <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">Registros de Partidas</p>
        </div>
        <button 
          onClick={handleNewMatch}
          className="bg-[#F4BE02] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"
        >
          <Plus size={14} /> Nova Súmula
        </button>
      </div>

      {showForm ? (
        <div className="bg-[#0A0A0A] p-6 rounded-[32px] border border-white/10 space-y-6 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-display font-bold">Configurar Súmula</h3>
                <button onClick={() => setShowForm(false)} className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Oponente</label>
                <input 
                  type="text" 
                  placeholder="Nome do Time Adversário" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-bold outline-none focus:border-[#F4BE02]/50 transition-all"
                  value={formMatch.opponent}
                  onChange={e => setFormMatch({...formMatch, opponent: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Data</label>
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-bold outline-none focus:border-[#F4BE02]/50 transition-all text-white/60"
                  value={formMatch.date}
                  onChange={e => setFormMatch({...formMatch, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={() => { setActiveQuadro('quadro1'); setShowRosterModal(true); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formMatch.rosterQ1.length > 0 ? 'border-[#F4BE02]/40 bg-[#F4BE02]/5' : 'border-white/5 bg-white/5'}`}
                  >
                    <Users size={18} className={formMatch.rosterQ1.length > 0 ? 'text-[#F4BE02]' : 'text-white/20'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Quadro 1 ({formMatch.rosterQ1.length})</span>
                  </button>
                  <button 
                    onClick={() => { setActiveQuadro('quadro2'); setShowRosterModal(true); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formMatch.rosterQ2.length > 0 ? 'border-[#F4BE02]/40 bg-[#F4BE02]/5' : 'border-white/5 bg-white/5'}`}
                  >
                    <Users size={18} className={formMatch.rosterQ2.length > 0 ? 'text-[#F4BE02]' : 'text-white/20'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Quadro 2 ({formMatch.rosterQ2.length})</span>
                  </button>
              </div>
              <button 
                onClick={() => {
                  const id = formMatch.id || Date.now().toString();
                  const newMatch: Match = {
                    id,
                    date: formMatch.date,
                    opponent: formMatch.opponent,
                    label: activeQuadro === 'quadro1' ? 'Quadro 1' : 'Quadro 2',
                    stats: activeQuadro === 'quadro1' ? formMatch.quadro1 : formMatch.quadro2,
                    notes: formMatch.notes,
                    roster: activeQuadro === 'quadro1' ? formMatch.rosterQ1 : formMatch.rosterQ2,
                    isFriendly: formMatch.isFriendly,
                    wo: formMatch.wo
                  };
                  if (formMatch.id) {
                    setMatches(prev => prev.map(m => m.id === id ? newMatch : m));
                  } else {
                    setMatches(prev => [...prev, newMatch]);
                  }
                  setShowForm(false);
                }}
                disabled={!formMatch.opponent}
                className="w-full bg-[#F4BE02] text-black font-black py-5 rounded-2xl uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all"
              >
                Salvar Súmula
              </button>
            </div>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {groupedMatches.length > 0 ? groupedMatches.map(group => (
            <div key={`${group.date}-${group.opponent}`} className="space-y-3">
               <div className="flex items-center gap-3 px-1">
                  <Calendar size={14} className="text-white/20" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    {new Date(group.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {group.matches.map(match => {
                    const { us, them } = calculateScoreAndPoints(match);
                    const mvp = getMVP(match);
                    return (
                      <div key={match.id} className="bg-[#0A0A0A] rounded-[24px] border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all">
                         <div className="p-5 flex justify-between items-start border-b border-white/[0.03]">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[8px] font-black bg-white/5 px-1.5 py-0.5 rounded text-white/40 uppercase tracking-widest">{match.label}</span>
                               </div>
                               <h4 className="font-bold text-base text-white">{match.opponent}</h4>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => openRatingModal(match)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-[#F4BE02] transition-colors"><Star size={16}/></button>
                               <button onClick={() => handleEditMatch(match)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"><Pencil size={16}/></button>
                            </div>
                         </div>
                         <div className="p-5 flex items-center justify-center gap-8 bg-white/[0.01]">
                            <div className="flex flex-col items-center">
                               <span className="text-3xl font-display font-bold text-white">{us}</span>
                               <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">100 Firula</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10"></div>
                            <div className="flex flex-col items-center">
                               <span className="text-3xl font-display font-bold text-white/40">{them}</span>
                               <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Oponente</span>
                            </div>
                         </div>
                         {mvp && (
                           <div className="px-5 py-3 border-t border-white/[0.03] flex items-center gap-2 bg-[#F4BE02]/5">
                              <Crown size={12} className="text-[#F4BE02]" />
                              <span className="text-[9px] font-bold text-[#F4BE02]/80 uppercase tracking-widest">Destaque: {mvp}</span>
                           </div>
                         )}
                      </div>
                    );
                  })}
               </div>
            </div>
          )) : (
            <div className="text-center py-20 opacity-20 flex flex-col items-center">
              <Trophy size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma súmula registrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sumulas;
