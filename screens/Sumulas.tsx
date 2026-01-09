
import React, { useState, useMemo } from 'react';
import { Match, Player, EventType, MatchEvent, QuadroStats, HalfStats } from '../types';
import { Plus, X, Calendar, Eraser, Save, Minus, CheckCircle2, Pencil, Handshake, Flag, Trophy, Star, ChevronLeft, ChevronRight, Crown, Users, Check, CheckSquare } from 'lucide-react';
import { ShieldAlert, Zap, Square } from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

type QuadroType = 'quadro2' | 'quadro1';

// Internal interface for the Form State
interface FormState {
    id?: string;
    opponent: string;
    date: string;
    notes: string;
    quadro1: QuadroStats;
    quadro2: QuadroStats;
    rosterQ1: string[]; // IDs of players in Quadro 1
    rosterQ2: string[]; // IDs of players in Quadro 2
    editingLabel?: 'Quadro 1' | 'Quadro 2';
    // Settings specific to the active view/editing
    isFriendly: boolean;
    wo: 'none' | 'win' | 'loss';
}

const Sumulas: React.FC<Props> = ({ matches, players, setMatches }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  
  // Rating Modal State
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const [tempRatings, setTempRatings] = useState<Record<string, number>>({});

  const [activeQuadro, setActiveQuadro] = useState<QuadroType>('quadro2');
  const [currentTempo, setCurrentTempo] = useState<1 | 2>(1);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  
  const createEmptyHalf = (): HalfStats => ({ fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] });
  
  // Sort players alphabetically
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
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
        rosterQ1: [], // Start empty
        rosterQ2: [], // Start empty
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
        // Use existing roster or empty if undefined
        rosterQ1: isQ1 && match.roster ? match.roster : [],
        rosterQ2: !isQ1 && match.roster ? match.roster : [],
        isFriendly: match.isFriendly || false,
        wo: match.wo || 'none'
    });
    
    setActiveQuadro(isQ1 ? 'quadro1' : 'quadro2');
    setSaveSuccess(null);
    setShowForm(true);
  };

  // --- Roster Logic ---
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
      const currentList = formMatch[field];
      const isAllSelected = currentList.length === players.length;

      setFormMatch(prev => ({
          ...prev,
          [field]: isAllSelected ? [] : [...allPlayerIds]
      }));
  };

  const getActiveRoster = () => {
      return activeQuadro === 'quadro1' ? formMatch.rosterQ1 : formMatch.rosterQ2;
  };

  // --- Rating Logic ---
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
      if (!match.playerRatings) return null;
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

  // Group matches by Date + Opponent
  const groupedMatches = useMemo(() => {
    const groups: Record<string, { date: string, opponent: string, matches: Match[] }> = {};
    
    matches.forEach(match => {
        const key = `${match.date}_${match.opponent}`;
        if (!groups[key]) {
            groups[key] = { date: match.date, opponent: match.opponent, matches: [] };
        }
        groups[key].matches.push(match);
    });

    // Sort by date descending
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches]);

  // Helper to get current half stats
  const getCurrentHalfStats = () => {
    const q = activeQuadro === 'quadro1' ? formMatch.quadro1 : formMatch.quadro2;
    return currentTempo === 1 ? q.tempo1 : q.tempo2;
  };

  const updateHalfStats = (value: Partial<HalfStats>) => {
    const qKey = activeQuadro;
    const tKey = currentTempo === 1 ? 'tempo1' : 'tempo2';

    setFormMatch(prev => ({
      ...prev,
      [qKey]: {
        ...prev[qKey],
        [tKey]: { ...prev[qKey][tKey], ...value }
      }
    }));
  };

  const handleOpponentStat = (stat: 'opponentGoals' | 'opponentFouls', delta: number) => {
    const currentHalf = getCurrentHalfStats();
    const newVal = Math.max(0, (currentHalf[stat] || 0) + delta);
    updateHalfStats({ [stat]: newVal });
  };

  const handlePlayerEvent = (playerId: string, type: EventType) => {
    const currentHalf = getCurrentHalfStats();
    const currentEvents = currentHalf.events;

    if (isRemoveMode) {
      const indexToRemove = [...currentEvents].reverse().findIndex(e => e.playerId === playerId && e.type === type);
      if (indexToRemove !== -1) {
        const realIndex = currentEvents.length - 1 - indexToRemove;
        const newEvents = [...currentEvents];
        newEvents.splice(realIndex, 1);
        updateHalfStats({ events: newEvents });
      }
    } else {
      const newEvent: MatchEvent = {
        id: Math.random().toString(36).substr(2, 9),
        playerId,
        type
      };
      updateHalfStats({ events: [...currentEvents, newEvent] });
    }
  };

  const getPlayerEventCount = (playerId: string, type: EventType) => {
    const q = activeQuadro === 'quadro1' ? formMatch.quadro1 : formMatch.quadro2;
    if (type === 'GOL' || type === 'ASSIST') {
       const t1Count = q.tempo1.events.filter(e => e.playerId === playerId && e.type === type).length;
       const t2Count = q.tempo2.events.filter(e => e.playerId === playerId && e.type === type).length;
       return t1Count + t2Count;
    }
    const currentHalf = currentTempo === 1 ? q.tempo1 : q.tempo2;
    return currentHalf.events.filter(e => e.playerId === playerId && e.type === type).length;
  };

  const activeQuadroStats = activeQuadro === 'quadro1' ? formMatch.quadro1 : formMatch.quadro2;
  
  const ourGoalsTotal = activeQuadroStats 
    ? activeQuadroStats.tempo1.events.filter(e => e.type === 'GOL').length + activeQuadroStats.tempo2.events.filter(e => e.type === 'GOL').length
    : 0;
  
  const opponentGoalsTotal = activeQuadroStats
    ? (activeQuadroStats.tempo1.opponentGoals || 0) + (activeQuadroStats.tempo2.opponentGoals || 0)
    : 0;

  const currentHalfStats = getCurrentHalfStats();
  const ourFouls = currentHalfStats ? currentHalfStats.events.filter(e => e.type === 'FALTA').length : 0;
  const opponentFouls = currentHalfStats ? (currentHalfStats.opponentFouls || 0) : 0;

  const handleSave = () => {
    if (!formMatch.opponent) return;
    
    const statsToSave = activeQuadro === 'quadro1' ? formMatch.quadro1 : formMatch.quadro2;
    const labelToSave = activeQuadro === 'quadro1' ? 'Quadro 1' : 'Quadro 2';
    const rosterToSave = activeQuadro === 'quadro1' ? formMatch.rosterQ1 : formMatch.rosterQ2;

    const matchData = {
      date: formMatch.date,
      opponent: formMatch.opponent,
      notes: formMatch.notes || '',
      label: labelToSave as 'Quadro 1' | 'Quadro 2',
      stats: statsToSave,
      isFriendly: formMatch.isFriendly,
      wo: formMatch.wo,
      roster: rosterToSave
    };

    if (formMatch.id && formMatch.editingLabel === labelToSave) {
        // Editing existing: Update and Close
        setMatches(prev => prev.map(m => m.id === formMatch.id ? { ...m, ...matchData } : m));
        setShowForm(false);
    } else {
        // Creating new: Add to list and KEEP OPEN
        const newMatch: Match = {
          id: Date.now().toString(),
          ...matchData,
          playerRatings: {}
        };
        setMatches(prev => [...prev, newMatch]);
        
        // Visual feedback
        setSaveSuccess(labelToSave);
        setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const calculateScoreAndPoints = (m: Match) => {
     let us = 0;
     let them = 0;
     let points = 0;
     
     // 1. Calculate raw goals
     const countG = (h: HalfStats) => h.events.filter(e => e.type === 'GOL').length;
     us = countG(m.stats.tempo1) + countG(m.stats.tempo2);
     them = (m.stats.tempo1.opponentGoals||0) + (m.stats.tempo2.opponentGoals||0);

     // 3. Calculate Points
     if (m.isFriendly) {
         points = 0;
     } else if (m.wo === 'win') {
         points = 3;
     } else if (m.wo === 'loss') {
         points = 0;
     } else {
         if (us > them) points = 3;
         else if (us === them) points = 1;
         else points = 0;
     }

     return { us, them, points };
  };

  const cycleWO = () => {
      if (formMatch.wo === 'none') setFormMatch(prev => ({ ...prev, wo: 'win' }));
      else if (formMatch.wo === 'win') setFormMatch(prev => ({ ...prev, wo: 'loss' }));
      else setFormMatch(prev => ({ ...prev, wo: 'none' }));
  };

  return (
    <div className="space-y-6">
      {/* RATING MODAL */}
      {ratingMatchId && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-[#0A0A0A] border-t border-white/10 sm:border sm:rounded-[32px] h-[85vh] sm:h-[800px] flex flex-col shadow-2xl slide-in-from-bottom-10 animate-in duration-300">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-display font-bold text-white">Avaliação</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">Quem jogou muito?</p>
                  </div>
                  <button onClick={() => setRatingMatchId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {sortedPlayers.map(p => {
                     // Check if player was in the roster for that match
                     const score = tempRatings[p.id] || 0;
                     return (
                         <div key={p.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${score > 0 ? 'bg-white/[0.03] border-[#F4BE02]/20' : 'bg-transparent border-white/5 opacity-60 hover:opacity-100'}`}>
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-sm">
                                     {p.name.charAt(0)}
                                 </div>
                                 <span className="font-bold text-sm">{p.name}</span>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                 <button onClick={() => handleRatePlayer(p.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 active:bg-white/20"><Minus size={14}/></button>
                                 <div className={`w-8 text-center font-display font-bold text-lg ${score >= 8 ? 'text-[#F4BE02]' : score > 0 ? 'text-white' : 'text-white/20'}`}>
                                     {score > 0 ? score : '-'}
                                 </div>
                                 <button onClick={() => handleRatePlayer(p.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 active:bg-[#F4BE02] active:text-black transition-colors"><Plus size={14}/></button>
                             </div>
                         </div>
                     )
                 })}
              </div>

              <div className="p-6 border-t border-white/5">
                  <button onClick={saveRatings} className="w-full py-4 bg-[#F4BE02] text-black font-black rounded-2xl uppercase tracking-widest shadow-[0_4px_20px_rgba(244,190,2,0.2)]">Confirmar Notas</button>
              </div>
           </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {showRosterModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-[#0A0A0A] border-t border-white/10 sm:border sm:rounded-[32px] h-[85vh] sm:h-[800px] flex flex-col shadow-2xl slide-in-from-bottom-10 animate-in duration-300">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-display font-bold text-white">Escalação</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">
                        Quem joga no {activeQuadro === 'quadro1' ? 'Quadro 1' : 'Quadro 2'}?
                      </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleAllRoster}
                        className="h-8 px-3 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                    >
                        {getActiveRoster().length === players.length ? 'Limpar' : 'Todos'}
                    </button>
                    <button onClick={() => setShowRosterModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20}/></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {sortedPlayers.map(p => {
                     const isSelected = getActiveRoster().includes(p.id);
                     return (
                         <button 
                            key={p.id} 
                            onClick={() => togglePlayerInRoster(p.id)}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isSelected ? 'bg-white/[0.05] border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}
                         >
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${isSelected ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'}`}>
                                     {p.name.charAt(0)}
                                 </div>
                                 <span className="font-bold text-sm">{p.name}</span>
                             </div>
                             
                             <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[#F4BE02] border-[#F4BE02] text-black' : 'border-white/20'}`}>
                                 {isSelected && <Check size={14} strokeWidth={3} />}
                             </div>
                         </button>
                     )
                 })}
              </div>

              <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
                  <button onClick={() => setShowRosterModal(false)} className="w-full py-4 bg-white/[0.05] hover:bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest transition-colors">
                      Concluir Seleção
                  </button>
              </div>
           </div>
        </div>
      )}

      {!showForm && (
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">SÚMULAS</h2>
            <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">Gestão de Partidas</p>
          </div>
          <button 
            onClick={handleNewMatch}
            className="w-12 h-12 bg-[#F4BE02] text-black rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {showForm ? (
        <div className="bg-[#0A0A0A] rounded-[32px] border border-white/[0.1] shadow-2xl flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-6 duration-300 relative overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#111] p-4 border-b border-white/5 flex flex-col gap-3 z-20">
             <div className="flex justify-between items-center">
                 <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10"><X size={16}/></button>
                 <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-[#F4BE02]" />
                    <input 
                        type="date" 
                        className="bg-transparent text-[10px] font-black text-white/60 uppercase tracking-widest outline-none text-right"
                        value={formMatch.date}
                        onChange={e => setFormMatch({...formMatch, date: e.target.value})}
                    />
                 </div>
                 <button 
                    onClick={() => setIsRemoveMode(!isRemoveMode)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRemoveMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40'}`}
                 >
                    <Eraser size={14} />
                 </button>
             </div>
             
             <div className="flex justify-center w-full">
                <input 
                    className="bg-transparent text-center font-display font-bold text-xl text-white placeholder:text-white/20 outline-none w-full"
                    placeholder="NOME DO ADVERSÁRIO"
                    value={formMatch.opponent}
                    onChange={e => setFormMatch({...formMatch, opponent: e.target.value})}
                />
             </div>

             {/* Settings Chips */}
             <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button 
                    onClick={() => setShowRosterModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/10 bg-white/5 text-white/60 hover:text-white transition-all"
                >
                    <Users size={12} /> Escalação ({getActiveRoster().length})
                </button>
                <button 
                    onClick={() => setFormMatch(prev => ({...prev, isFriendly: !prev.isFriendly}))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${formMatch.isFriendly ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : 'bg-white/5 text-white/30 border-white/5'}`}
                >
                    <Handshake size={12} /> {formMatch.isFriendly ? 'Amistoso' : 'Pontuado'}
                </button>
                <button 
                    onClick={cycleWO}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                        formMatch.wo === 'win' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        formMatch.wo === 'loss' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        'bg-white/5 text-white/30 border-white/5'
                    }`}
                >
                    <Flag size={12} /> 
                    {formMatch.wo === 'none' ? 'Sem W.O.' : formMatch.wo === 'win' ? 'W.O. (Vitória)' : 'W.O. (Derrota)'}
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto relative bg-[#0A0A0A]">
            <div className="flex flex-col h-full">
                
                {/* Quadro Tabs */}
                <div className="grid grid-cols-2 p-2 gap-2 bg-[#111]">
                    {(['quadro2', 'quadro1'] as QuadroType[]).map(q => {
                        const isDisabled = formMatch.id && formMatch.editingLabel && 
                                           ((formMatch.editingLabel === 'Quadro 1' && q !== 'quadro1') ||
                                            (formMatch.editingLabel === 'Quadro 2' && q !== 'quadro2'));
                        return (
                            <button
                                key={q}
                                disabled={!!isDisabled}
                                onClick={() => setActiveQuadro(q)}
                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all border flex items-center justify-center gap-2 ${
                                    activeQuadro === q 
                                    ? 'bg-[#F4BE02] text-black border-[#F4BE02]' 
                                    : 'bg-white/[0.03] text-white/30 border-white/[0.05]'
                                } ${isDisabled ? 'opacity-20' : ''}`}
                            >
                                {q === 'quadro2' ? 'Quadro 2' : 'Quadro 1'}
                            </button>
                        );
                    })}
                </div>

                {/* Scoreboard Area */}
                <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 shadow-2xl">
                    <div className="py-4 px-6 flex items-center justify-between">
                         <div className="flex flex-col items-center w-1/3">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">100 FIRULA</span>
                            <span className="text-5xl font-display font-bold text-[#F4BE02] leading-none">{ourGoalsTotal}</span>
                         </div>
                         <div className="text-white/10 font-black text-2xl">X</div>
                         <div className="flex flex-col items-center w-1/3 group relative">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">ADVERSÁRIO</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleOpponentStat('opponentGoals', -1)} className="text-white/20 hover:text-white p-1"><Minus size={14}/></button>
                                <span className="text-5xl font-display font-bold text-white leading-none">{opponentGoalsTotal}</span>
                                <button onClick={() => handleOpponentStat('opponentGoals', 1)} className="text-[#F4BE02]/50 hover:text-[#F4BE02] p-1"><Plus size={14}/></button>
                            </div>
                         </div>
                    </div>

                    <div className="flex justify-center pb-3">
                        <div className="bg-white/[0.05] p-1 rounded-lg flex">
                             <button onClick={() => setCurrentTempo(1)} className={`px-6 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${currentTempo === 1 ? 'bg-white text-black' : 'text-white/40'}`}>1º Tempo</button>
                             <button onClick={() => setCurrentTempo(2)} className={`px-6 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${currentTempo === 2 ? 'bg-white text-black' : 'text-white/40'}`}>2º Tempo</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
                        <div className="flex items-center justify-center p-2 gap-2">
                             <span className={`text-xl font-bold font-display ${ourFouls >= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{ourFouls}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Faltas (Nós)</span>
                        </div>
                        <div className="flex items-center justify-center p-2 gap-2">
                            <button onClick={() => handleOpponentStat('opponentFouls', -1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-white/30"><Minus size={10}/></button>
                            <span className="text-xl font-bold font-display text-red-500">{opponentFouls}</span>
                            <button onClick={() => handleOpponentStat('opponentFouls', 1)} className="w-5 h-5 flex items-center justify-center bg-red-500/10 rounded text-red-500"><Plus size={10}/></button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Faltas (Eles)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-[1.5fr_repeat(5,1fr)] gap-2 px-3 pb-2 pt-4 bg-[#0A0A0A]">
                         <div className="text-[8px] font-black text-white/20 uppercase tracking-widest self-end pl-1">Atleta</div>
                         <div className="text-[8px] font-black text-green-500 text-center uppercase tracking-widest">Gols</div>
                         <div className="text-[8px] font-black text-[#F4BE02] text-center uppercase tracking-widest">Assis</div>
                         <div className="text-[8px] font-black text-red-500 text-center uppercase tracking-widest">Falta</div>
                         <div className="text-[8px] font-black text-yellow-500 text-center uppercase tracking-widest">CA</div>
                         <div className="text-[8px] font-black text-red-600 text-center uppercase tracking-widest">CV</div>
                    </div>
                </div>

                {/* Player List */}
                <div className="flex-1 p-3 space-y-1.5 pb-32">
                   {sortedPlayers.filter(p => getActiveRoster().includes(p.id)).map(player => (
                     <div key={player.id} className="grid grid-cols-[1.5fr_repeat(5,1fr)] gap-1.5 items-center bg-white/[0.02] border border-white/[0.05] p-2 rounded-xl">
                        <div className="truncate pr-1">
                           <p className="text-xs font-bold text-white leading-none truncate">{player.name}</p>
                           <p className="text-[8px] text-white/30 uppercase mt-1 font-bold">{player.position.substring(0,3)}</p>
                        </div>
                        <StatButton count={getPlayerEventCount(player.id, 'GOL')} onClick={() => handlePlayerEvent(player.id, 'GOL')} colorClass="text-green-500 bg-green-500/10 border-green-500/20 active:bg-green-500 active:text-black" isRemoveMode={isRemoveMode} />
                        <StatButton count={getPlayerEventCount(player.id, 'ASSIST')} onClick={() => handlePlayerEvent(player.id, 'ASSIST')} icon={<Zap size={10} />} colorClass="text-[#F4BE02] bg-[#F4BE02]/10 border-[#F4BE02]/20 active:bg-[#F4BE02] active:text-black" isRemoveMode={isRemoveMode} />
                        <StatButton count={getPlayerEventCount(player.id, 'FALTA')} onClick={() => handlePlayerEvent(player.id, 'FALTA')} icon={<ShieldAlert size={10} />} colorClass="text-red-500 bg-red-500/10 border-red-500/20 active:bg-red-500 active:text-white" isRemoveMode={isRemoveMode} />
                        <StatButton count={getPlayerEventCount(player.id, 'AMARELO')} onClick={() => handlePlayerEvent(player.id, 'AMARELO')} icon={<Square size={10} fill="currentColor" />} colorClass="text-yellow-500 bg-yellow-500/10 border-yellow-500/20 active:bg-yellow-500 active:text-black" isRemoveMode={isRemoveMode} />
                        <StatButton count={getPlayerEventCount(player.id, 'VERMELHO')} onClick={() => handlePlayerEvent(player.id, 'VERMELHO')} icon={<Square size={10} fill="currentColor" />} colorClass="text-red-700 bg-red-700/10 border-red-700/20 active:bg-red-700 active:text-white" isRemoveMode={isRemoveMode} />
                     </div>
                   ))}
                   {players.filter(p => getActiveRoster().includes(p.id)).length === 0 && (
                       <div className="text-center py-10 opacity-30">
                           <p className="text-[10px] uppercase font-bold tracking-widest">Nenhum atleta na escalação</p>
                           <button onClick={() => setShowRosterModal(true)} className="text-[#F4BE02] text-xs font-bold mt-2 underline">Editar Escalação</button>
                       </div>
                   )}
                </div>
            </div>
          </div>

          {/* Save Button - Compact & Positioned */}
          <div className="absolute bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <button 
               onClick={handleSave} 
               disabled={!formMatch.opponent}
               className={`pointer-events-auto px-8 py-3 rounded-full flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md transition-all active:scale-[0.96] disabled:opacity-50 disabled:shadow-none ${saveSuccess ? 'bg-green-500 text-white' : 'bg-[#F4BE02] text-black'}`}
             >
               {saveSuccess ? <CheckCircle2 size={18}/> : <Save size={18} />}
               <span className="font-black text-xs uppercase tracking-widest">
                   {saveSuccess ? `SALVO` : (formMatch.id && formMatch.editingLabel === (activeQuadro === 'quadro1' ? 'Quadro 1' : 'Quadro 2')
                    ? `ATUALIZAR` 
                    : `SALVAR QUADRO`)}
               </span>
             </button>
          </div>
        </div>
      ) : (
        /* Match List View - Grouped */
        <div className="space-y-6">
          {groupedMatches.length === 0 && (
             <div className="text-center py-20 opacity-20">
               <Calendar size={48} className="mx-auto mb-4" />
               <p className="font-bold uppercase tracking-widest text-xs">Sem súmulas registradas</p>
             </div>
          )}
          
          {groupedMatches.map((group) => {
             const key = `${group.date}_${group.opponent}`;
             const q1Match = group.matches.find(m => m.label === 'Quadro 1');
             const q2Match = group.matches.find(m => m.label === 'Quadro 2');
             
             // Scores
             const q1Score = q1Match ? calculateScoreAndPoints(q1Match) : null;
             const q2Score = q2Match ? calculateScoreAndPoints(q2Match) : null;

             const renderMatchRow = (match: Match | undefined, score: any, label: string) => {
                 if (!match || !score) {
                     return (
                        <div className="border border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/20 h-[88px]">
                            {label} Pendente
                        </div>
                     );
                 }

                 const mvpName = getMVP(match);

                 return (
                    <div className="bg-[#111] rounded-2xl p-3 pr-4 flex items-center justify-between relative overflow-hidden min-h-[88px] group/item">
                        <div className="flex flex-col gap-1 z-10 items-start flex-1 min-w-0 pr-2">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</span>
                            <div className="flex flex-wrap gap-1">
                                {match.isFriendly ? (
                                    <div className="inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 items-center gap-1">
                                        <Handshake size={8} /> Amistoso
                                    </div>
                                ) : match.wo !== 'none' ? (
                                    <div className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider items-center gap-1 ${match.wo === 'win' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Flag size={8} /> {match.wo === 'win' ? 'W.O. (V)' : 'W.O. (D)'}
                                    </div>
                                ) : (
                                    <div className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${score.points === 3 ? 'bg-green-500/10 text-green-500' : score.points === 1 ? 'bg-white/10 text-white' : 'bg-red-500/10 text-red-500'}`}>
                                        {score.points === 3 ? 'Vitória' : score.points === 1 ? 'Empate' : 'Derrota'}
                                    </div>
                                )}
                                
                                <div className="inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#F4BE02]/10 text-[#F4BE02] items-center gap-1">
                                    {score.points > 0 ? '+' : ''}{score.points} Pts
                                </div>
                            </div>
                            
                            {/* MVP Badge */}
                            {mvpName && (
                                <div className="inline-flex items-center gap-1 mt-1 bg-gradient-to-r from-[#F4BE02]/10 to-transparent pr-2 rounded-full">
                                    <Crown size={10} className="text-[#F4BE02]" fill="currentColor" />
                                    <span className="text-[8px] font-black text-white/80 uppercase tracking-wider truncate max-w-[100px]">
                                        {mvpName}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 z-10">
                            <div className="flex items-center gap-3">
                                <span className={`text-2xl sm:text-3xl font-display font-bold ${score.us > score.them ? 'text-[#F4BE02]' : 'text-white'}`}>{score.us}</span>
                                <span className="text-white/10 font-bold text-sm">x</span>
                                <span className={`text-2xl sm:text-3xl font-display font-bold ${score.them > score.us ? 'text-red-500' : 'text-white'}`}>{score.them}</span>
                            </div>

                            <div className="w-[1px] h-8 bg-white/5 mx-1"></div>

                            <div className="flex flex-col gap-1.5">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openRatingModal(match); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#F4BE02] active:scale-95 transition-all hover:bg-[#F4BE02] hover:text-black"
                                >
                                    <Star size={14} fill={match.playerRatings && Object.keys(match.playerRatings).length > 0 ? "currentColor" : "none"} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditMatch(match); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 active:scale-95 transition-all hover:text-white hover:bg-white/10"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                 );
             };

             return (
               <div key={key} className="bg-[#0A0A0A] rounded-[32px] overflow-hidden border border-white/[0.08] shadow-lg group">
                  {/* Event Header */}
                  <div className="bg-white/[0.03] px-6 py-4 border-b border-white/[0.04] flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar size={12} className="text-[#F4BE02]" /> 
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                {new Date(group.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                            </span>
                        </div>
                        <h3 className="font-display font-bold text-lg leading-none">{group.opponent}</h3>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                      {renderMatchRow(q1Match, q1Score, 'Quadro 1')}
                      {renderMatchRow(q2Match, q2Score, 'Quadro 2')}
                  </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
};

const StatButton = ({ count, onClick, colorClass, icon, isRemoveMode }: any) => {
    const finalStyle = isRemoveMode 
        ? "border-red-500/50 bg-red-500/5 text-red-500 opacity-80" 
        : colorClass;

    return (
      <button 
        onClick={onClick}
        className={`h-10 rounded-lg flex items-center justify-center border transition-all relative overflow-hidden ${finalStyle}`}
      >
        <div className="relative z-10 flex items-center justify-center gap-1">
          {isRemoveMode ? (
              <Minus size={12} strokeWidth={4} />
          ) : (
              <>
                {icon}
                <span className={`font-black ${count > 0 ? 'text-sm' : 'text-xs opacity-50'}`}>
                    {count > 0 ? count : (icon ? '' : '+')}
                </span>
              </>
          )}
        </div>
      </button>
    );
};

export default Sumulas;
