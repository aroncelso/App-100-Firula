
import React, { useState, useMemo, useEffect } from 'react';
import { Match, Player, EventType, MatchEvent, HalfStats, RatingDetail } from '../types';
import { 
  Plus, X, Calendar, Minus, CheckCircle2, Pencil, 
  Trophy, Star, Crown, Users, Check, Square, ShieldAlert,
  Zap, Target, AlertTriangle, UserCheck,
  Ban, MinusCircle, AlertCircle, UserCog, Filter, ChevronDown, Flag,
  LayoutGrid, Image as ImageIcon, Search, Share2
} from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

type QuadroType = 'Quadro 1' | 'Quadro 2';

const HOME_TEAM_LOGO = "https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png";

const Sumulas: React.FC<Props> = ({ matches, players, setMatches }) => {
  const currentYear = new Date().getFullYear().toString();
  const [showForm, setShowForm] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  
  // Rating State
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const [currentEvaluatorId, setCurrentEvaluatorId] = useState<string>('');
  
  // Controle da Partida Ativa (Sessão de Edição)
  const [activeQuadro, setActiveQuadro] = useState<QuadroType>('Quadro 2');
  const [sessionMatchIds, setSessionMatchIds] = useState<{ q1: string | null, q2: string | null }>({ q1: null, q2: null });
  const [currentTempo, setCurrentTempo] = useState<1 | 2>(1);
  const [activeStep, setActiveStep] = useState<'info' | 'events'>('info');

  // --- LÓGICA DE FILTROS INTELIGENTES ---
  const [filterYear, setFilterYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
      if (m.date) {
        const y = String(m.date).split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
        const mYear = String(m.date).split('-')[0];
        const yearMatch = mYear === filterYear;
        const nameMatch = (m.opponent || '').toLowerCase().includes(searchTerm.toLowerCase());
        return yearMatch && nameMatch;
    });
  }, [matches, filterYear, searchTerm]);

  // Agrupamento visual por Data (Rodada)
  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      const dateKey = m.date || 'Sem Data';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    // Ordena as datas
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredMatches]);

  const activePlayers = useMemo(() => players.filter(p => p.active !== false).sort((a,b) => a.name.localeCompare(b.name)), [players]);

  const createEmptyHalf = (): HalfStats => ({ fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] });

  const createNewMatchObject = (id: string, label: QuadroType, date: string, opponent: string, isFriendly: boolean): Match => ({
    id,
    date,
    opponent,
    opponentLogo: '',
    label,
    stats: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
    notes: '',
    roster: [],
    detailedRatings: {},
    playerRatings: {},
    coach: '',
    referee: '',
    isFriendly,
    wo: 'none'
  });

  // --- GESTÃO DE ESTADO E SYNC ---

  const currentMatch = useMemo(() => {
    const id = activeQuadro === 'Quadro 1' ? sessionMatchIds.q1 : sessionMatchIds.q2;
    return matches.find(m => m.id === id);
  }, [matches, activeQuadro, sessionMatchIds]);

  const updateMatchInGlobal = (updatedMatch: Match) => {
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    
    // Sincroniza campos comuns
    const partnerId = updatedMatch.label === 'Quadro 1' ? sessionMatchIds.q2 : sessionMatchIds.q1;
    if (partnerId) {
      setMatches(prev => prev.map(m => {
        if (m.id === partnerId) {
          if (m.date !== updatedMatch.date || m.opponent !== updatedMatch.opponent || m.isFriendly !== updatedMatch.isFriendly || m.opponentLogo !== updatedMatch.opponentLogo) {
            return {
              ...m,
              date: updatedMatch.date,
              opponent: updatedMatch.opponent,
              opponentLogo: updatedMatch.opponentLogo,
              isFriendly: updatedMatch.isFriendly
            };
          }
        }
        return m;
      }));
    }
  };

  // --- HANDLERS ---

  const handleNewMatchDay = () => {
    const today = new Date().toISOString().split('T')[0];
    const idQ2 = Date.now().toString();
    const idQ1 = (Date.now() + 1).toString();

    const matchQ2 = createNewMatchObject(idQ2, 'Quadro 2', today, '', false);
    const matchQ1 = createNewMatchObject(idQ1, 'Quadro 1', today, '', false);

    setMatches(prev => [...prev, matchQ2, matchQ1]);
    setSessionMatchIds({ q1: idQ1, q2: idQ2 });
    setActiveQuadro('Quadro 2');
    setActiveStep('info');
    setShowForm(true);
  };

  const handleEditMatchGroup = (match: Match) => {
    const partner = matches.find(m => m.date === match.date && m.label !== match.label);
    
    let q1Id = match.label === 'Quadro 1' ? match.id : partner?.label === 'Quadro 1' ? partner.id : null;
    let q2Id = match.label === 'Quadro 2' ? match.id : partner?.label === 'Quadro 2' ? partner.id : null;

    if (!q1Id) {
       q1Id = Date.now().toString();
       const newQ1 = createNewMatchObject(q1Id, 'Quadro 1', match.date, match.opponent, match.isFriendly || false);
       setMatches(prev => [...prev, newQ1]);
    }
    if (!q2Id) {
       q2Id = Date.now().toString();
       const newQ2 = createNewMatchObject(q2Id, 'Quadro 2', match.date, match.opponent, match.isFriendly || false);
       setMatches(prev => [...prev, newQ2]);
    }

    setSessionMatchIds({ q1: q1Id, q2: q2Id });
    setActiveQuadro(match.label as QuadroType);
    setActiveStep('info');
    setShowForm(true);
  };

  const addEvent = (playerId: string, type: EventType) => {
    if (!currentMatch) return;
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    const newEvent: MatchEvent = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), playerId, type };
    
    const updatedStats = { ...currentMatch.stats };
    updatedStats[tempoKey].events = [...updatedStats[tempoKey].events, newEvent];
    
    if (type === 'FALTA') {
      updatedStats[tempoKey].fouls = (updatedStats[tempoKey].fouls || 0) + 1;
    }

    updateMatchInGlobal({ ...currentMatch, stats: updatedStats });
  };

  const removeEvent = (eventId: string) => {
    if (!currentMatch) return;
    const stats = { ...currentMatch.stats };
    
    if (stats.tempo1.events.some(e => e.id === eventId)) {
        const evt = stats.tempo1.events.find(e => e.id === eventId);
        if (evt?.type === 'FALTA') stats.tempo1.fouls = Math.max(0, (stats.tempo1.fouls || 0) - 1);
        stats.tempo1.events = stats.tempo1.events.filter(e => e.id !== eventId);
    }
    else if (stats.tempo2.events.some(e => e.id === eventId)) {
        const evt = stats.tempo2.events.find(e => e.id === eventId);
        if (evt?.type === 'FALTA') stats.tempo2.fouls = Math.max(0, (stats.tempo2.fouls || 0) - 1);
        stats.tempo2.events = stats.tempo2.events.filter(e => e.id !== eventId);
    }

    updateMatchInGlobal({ ...currentMatch, stats });
  };

  const updateOpponentStats = (field: 'opponentGoals' | 'opponentFouls', delta: number) => {
    if (!currentMatch) return;
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    const stats = { ...currentMatch.stats };
    stats[tempoKey][field] = Math.max(0, (stats[tempoKey][field] || 0) + delta);
    updateMatchInGlobal({ ...currentMatch, stats });
  };

  const updateFouls = (delta: number) => {
    if (!currentMatch) return;
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    const stats = { ...currentMatch.stats };
    stats[tempoKey].fouls = Math.max(0, (stats[tempoKey].fouls || 0) + delta);
    updateMatchInGlobal({ ...currentMatch, stats });
  };

  const calculateScore = (m: Match | undefined) => {
    if (!m || !m.stats) return { us: 0, them: 0 };
    const us = (m.stats.tempo1.events.filter(e => e.type === 'GOL').length) + 
               (m.stats.tempo2.events.filter(e => e.type === 'GOL').length);
    const them = (m.stats.tempo1.opponentGoals || 0) + (m.stats.tempo2.opponentGoals || 0);
    return { us, them };
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
    return players.find(p => p.id === mvpId)?.name || null;
  };

  const handleShareMatchDay = (dayMatches: Match[]) => {
      if (dayMatches.length === 0) return;
      
      const mainMatch = dayMatches[0];
      const dateStr = mainMatch.date ? new Date(mainMatch.date + 'T00:00:00').toLocaleDateString('pt-BR') : '';
      
      let text = `*RESUMO DA RODADA - 100 FIRULA*\n`;
      text += `📅 *${dateStr}* | 🆚 *${mainMatch.opponent}*\n\n`;

      // Ordena por Label (Quadro 1, Quadro 2)
      const sortedMatches = [...dayMatches].sort((a, b) => a.label.localeCompare(b.label));

      sortedMatches.forEach((match, index) => {
          const score = calculateScore(match);
          const mvp = getMVP(match);
          
          const allEvents = [...match.stats.tempo1.events, ...match.stats.tempo2.events];
          
          const getPlayerNamesByEvent = (type: EventType) => {
              const counts: Record<string, number> = {};
              allEvents.filter(e => e.type === type).forEach(e => {
                  counts[e.playerId] = (counts[e.playerId] || 0) + 1;
              });
              
              return Object.entries(counts)
                  .map(([pid, count]) => {
                      const p = players.find(p => p.id === pid);
                      return count > 1 ? `${p?.name} (${count})` : p?.name;
                  })
                  .filter(Boolean)
                  .join(', ');
          };

          const goalsList = getPlayerNamesByEvent('GOL');
          const assistsList = getPlayerNamesByEvent('ASSIST');
          const yellowList = getPlayerNamesByEvent('AMARELO');
          const redList = getPlayerNamesByEvent('VERMELHO');

          text += `🏆 *${match.label.toUpperCase()}*\n`;
          text += `⚔️ 100 Firula ${score.us} x ${score.them} ${match.opponent}\n`;
          
          if (goalsList) text += `⚽ *Gols:* ${goalsList}\n`;
          if (assistsList) text += `👟 *Assis:* ${assistsList}\n`;
          if (yellowList) text += `🟨 *CA:* ${yellowList}\n`;
          if (redList) text += `🟥 *CV:* ${redList}\n`;
          
          if (mvp) text += `👑 *Craque:* ${mvp}\n`;
          if (match.coach) text += `👨‍💼 *Técnico:* ${match.coach}\n`;
          
          if (match.notes) text += `📝 ${match.notes}\n`;

          if (index < sortedMatches.length - 1) {
              text += `\n━━━━━━━━━━━━━━━━━━\n\n`;
          }
      });

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
        case 'GOL': return <Target size={12} className="text-[#F4BE02]" />;
        case 'ASSIST': return <Zap size={12} className="text-blue-400" />;
        case 'AMARELO': return <Square size={12} className="text-yellow-500" fill="currentColor" />;
        case 'VERMELHO': return <Square size={12} className="text-red-600" fill="currentColor" />;
        case 'FALTA': return <AlertTriangle size={12} className="text-orange-400" />;
        case 'GOL_CONTRA': return <ShieldAlert size={12} className="text-red-500" />;
        case 'PENALTI_SOFRIDO': return <CheckCircle2 size={12} className="text-green-500" />;
        case 'PENALTI_COMETIDO': return <MinusCircle size={12} className="text-red-500" />;
        case 'PENALTI_PERDIDO': return <Ban size={12} className="text-white/40" />;
        default: return <AlertCircle size={12} />;
    }
  };

  const toggleSelectAll = () => {
    if (!currentMatch) return;
    const currentRoster = currentMatch.roster || [];
    const selectablePlayers = players.filter(p => p.active !== false);
    
    let newRoster: string[];
    if (currentRoster.length === selectablePlayers.length) {
        newRoster = [];
    } else {
        newRoster = selectablePlayers.map(p => p.id);
    }
    updateMatchInGlobal({ ...currentMatch, roster: newRoster });
  };

  // --- LÓGICA DE AVALIAÇÃO (RATING) ---
  const handleRatePlayer = (targetPlayerId: string, newScore: number) => {
      if (!ratingMatchId || !currentEvaluatorId) return;
      
      setMatches(prev => prev.map(m => {
          if (m.id !== ratingMatchId) return m;

          // 1. Atualiza detalhes
          const currentDetails = m.detailedRatings || {};
          const playerDetails = currentDetails[targetPlayerId] || [];
          
          // Remove avaliação anterior deste avaliador se existir
          const otherRatings = playerDetails.filter(r => r.evaluatorId !== currentEvaluatorId);
          
          // Adiciona nova (se > 0)
          const updatedPlayerDetails = newScore > 0 
              ? [...otherRatings, { evaluatorId: currentEvaluatorId, score: newScore }]
              : otherRatings;

          const newDetailedRatings = { ...currentDetails, [targetPlayerId]: updatedPlayerDetails };

          // 2. Recalcula média
          const scores = updatedPlayerDetails.map(r => r.score);
          const avg = scores.length > 0 
              ? scores.reduce((a, b) => a + b, 0) / scores.length 
              : 0;

          const newPlayerRatings = { ...m.playerRatings, [targetPlayerId]: avg };
          
          // Se média for 0, remove do objeto
          if (avg === 0) delete newPlayerRatings[targetPlayerId];

          return {
              ...m,
              detailedRatings: newDetailedRatings,
              playerRatings: newPlayerRatings
          };
      }));
  };

  const getMyRatingForPlayer = (targetPlayerId: string): number => {
      const m = matches.find(m => m.id === ratingMatchId);
      if (!m || !m.detailedRatings || !currentEvaluatorId) return 0;
      
      const details = m.detailedRatings[targetPlayerId] || [];
      const myRating = details.find(r => r.evaluatorId === currentEvaluatorId);
      return myRating ? myRating.score : 0;
  };

  // --- RENDER ---

  return (
    <div className="space-y-6 pb-24">
      {!showForm && (
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-display font-bold">PARTIDAS</h2>
            <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">Controle de Rodadas</p>
          </div>
          <button 
            onClick={handleNewMatchDay}
            className="bg-[#F4BE02] text-black px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
          >
            <Plus size={16} /> Nova Partida
          </button>
        </div>
      )}

      {showForm && currentMatch ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* HEADER DA SESSÃO: Alternar Quadros */}
          <div className="flex items-center gap-2 bg-[#111] p-1.5 rounded-2xl border border-white/10">
             <button 
                onClick={() => setActiveQuadro('Quadro 2')}
                className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeQuadro === 'Quadro 2' ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30 hover:bg-white/5'}`}
             >
                <span className="text-[10px] font-black uppercase tracking-widest">Quadro 2</span>
             </button>
             <button 
                onClick={() => setActiveQuadro('Quadro 1')}
                className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeQuadro === 'Quadro 1' ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30 hover:bg-white/5'}`}
             >
                <span className="text-[10px] font-black uppercase tracking-widest">Quadro 1</span>
             </button>
          </div>

          {/* Sub-menu de Etapas */}
          <div className="flex gap-2">
            <button onClick={() => setActiveStep('info')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeStep === 'info' ? 'bg-white text-black border-white' : 'bg-transparent text-white/30 border-white/10'}`}>1. Info & Elenco</button>
            <button 
                onClick={() => {
                    if (!currentMatch.opponent) {
                        alert('Informe o nome do adversário primeiro.');
                        return;
                    }
                    setActiveStep('events');
                }} 
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeStep === 'events' ? 'bg-white text-black border-white' : 'bg-transparent text-white/30 border-white/10'}`}
            >
                2. Súmula (Ao Vivo)
            </button>
          </div>

          {activeStep === 'info' ? (
            <div className="bg-[#0A0A0A] p-6 rounded-[32px] border border-white/10 space-y-6">
              <div className="space-y-4">
                {/* CAMPOS COMUNS */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Nome do Adversário (Comum)</label>
                  <input 
                    type="text" 
                    placeholder="NOME DO TIME RIVAL" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:border-[#F4BE02]/50 transition-all text-sm uppercase"
                    value={currentMatch.opponent}
                    onChange={e => updateMatchInGlobal({...currentMatch, opponent: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">URL Escudo Rival (Imagem)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input 
                        type="text" 
                        placeholder="Link da imagem (https://...)" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 font-medium outline-none focus:border-[#F4BE02]/50 transition-all text-xs"
                        value={currentMatch.opponentLogo || ''}
                        onChange={e => updateMatchInGlobal({...currentMatch, opponentLogo: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none text-white/60 text-xs"
                      value={currentMatch.date}
                      onChange={e => updateMatchInGlobal({...currentMatch, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Tipo de Jogo</label>
                     <button 
                        onClick={() => updateMatchInGlobal({...currentMatch, isFriendly: !currentMatch.isFriendly})}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${currentMatch.isFriendly ? 'bg-[#F4BE02]/10 border-[#F4BE02]/40 text-[#F4BE02]' : 'bg-white/5 border-white/5 text-white/30'}`}
                      >
                        <Star size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{currentMatch.isFriendly ? 'Amistoso' : 'Oficial'}</span>
                      </button>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-2"></div>

                {/* CAMPOS ESPECÍFICOS */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 rounded bg-[#F4BE02] text-black text-[9px] font-black uppercase tracking-wider">{activeQuadro}</div>
                    <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Dados Específicos</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Árbitro do {activeQuadro}</label>
                  <div className="relative">
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 font-bold outline-none focus:border-[#F4BE02]/50 transition-all text-sm uppercase appearance-none text-white"
                        value={currentMatch.referee || ''}
                        onChange={e => updateMatchInGlobal({...currentMatch, referee: e.target.value})}
                    >
                        <option value="" className="bg-[#0A0A0A] text-white/50">Selecione o Árbitro</option>
                        {activePlayers.map(p => (
                                <option key={p.id} value={p.name} className="bg-[#0A0A0A] text-white">
                                    {p.name}
                                </option>
                            ))
                        }
                    </select>
                    <Flag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </div>

                <button 
                  onClick={() => setShowRosterModal(true)}
                  className="w-full p-4 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between group active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F4BE02]/10 flex items-center justify-center text-[#F4BE02]">
                        <Users size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest block text-white/60">Elenco do {activeQuadro}</span>
                        <span className="text-sm font-bold text-white">{currentMatch.roster?.length || 0} Atletas</span>
                      </div>
                  </div>
                  <ChevronDown size={16} className="text-white/20" />
                </button>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Observações ({activeQuadro})</label>
                  <textarea 
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-medium outline-none text-xs uppercase"
                    value={currentMatch.notes}
                    onChange={e => updateMatchInGlobal({...currentMatch, notes: e.target.value.toUpperCase()})}
                    placeholder="W.O., Atrasos, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                 <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40">Sair</button>
                 <button 
                    onClick={() => setActiveStep('events')} 
                    disabled={!currentMatch.opponent}
                    className="flex-[2] py-4 bg-[#F4BE02] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-500/10 disabled:opacity-50"
                 >
                    Ir para o Jogo
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              {/* PLACAR REAL-TIME COM ESCUDOS */}
              <div className="bg-[#111] p-6 rounded-[32px] border border-white/10 relative overflow-hidden">
                <div className="absolute top-2 left-0 right-0 text-center z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F4BE02] bg-[#F4BE02]/10 px-3 py-1 rounded-full">{activeQuadro}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                    {/* Time Casa */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                        <div className="w-20 h-20 rounded-full bg-black border-2 border-[#F4BE02]/20 p-2 shadow-[0_0_20px_rgba(244,190,2,0.1)] flex items-center justify-center">
                            <img src={HOME_TEAM_LOGO} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">100 Firula</span>
                    </div>

                    {/* Placar Central */}
                    <div className="flex items-center gap-4">
                        <span className="text-6xl font-display font-bold text-white drop-shadow-xl">{calculateScore(currentMatch).us}</span>
                        <div className="h-8 w-[1px] bg-white/10 rotate-12"></div>
                        <span className="text-6xl font-display font-bold text-white/40 drop-shadow-xl">{calculateScore(currentMatch).them}</span>
                    </div>

                    {/* Time Rival */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                        <div className="w-20 h-20 rounded-full bg-black border-2 border-white/10 p-2 shadow-lg flex items-center justify-center overflow-hidden">
                            {currentMatch.opponentLogo ? (
                                <img src={currentMatch.opponentLogo} className="w-full h-full object-contain" />
                            ) : (
                                <Trophy size={32} className="text-white/20"/>
                            )}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate w-full text-center">{currentMatch.opponent || 'Oponente'}</span>
                    </div>
                </div>
              </div>

              {/* Controle do Tempo */}
              <div className="flex bg-[#0A0A0A] p-1.5 rounded-2xl border border-white/10">
                <button onClick={() => setCurrentTempo(1)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTempo === 1 ? 'bg-white/10 text-white shadow-inner' : 'text-white/20'}`}>1º Tempo</button>
                <button onClick={() => setCurrentTempo(2)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTempo === 2 ? 'bg-white/10 text-white shadow-inner' : 'text-white/20'}`}>2º Tempo</button>
              </div>

              {/* Status Oponente e Time */}
              <div className="bg-[#0A0A0A] p-5 rounded-[28px] border border-white/10 space-y-6">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Status {currentTempo}º Tempo</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#F4BE02]">Adversário</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                       <span className="text-[8px] font-black uppercase text-red-500/60">Gols Sofridos</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => updateOpponentStats('opponentGoals', -1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Minus size={12}/></button>
                          <span className="text-2xl font-display font-bold">{currentMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].opponentGoals || 0}</span>
                          <button onClick={() => updateOpponentStats('opponentGoals', 1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Plus size={12}/></button>
                       </div>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                       <span className="text-[8px] font-black uppercase text-yellow-500/60">Faltas Deles</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => updateOpponentStats('opponentFouls', -1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Minus size={12}/></button>
                          <span className="text-2xl font-display font-bold">{currentMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].opponentFouls || 0}</span>
                          <button onClick={() => updateOpponentStats('opponentFouls', 1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Plus size={12}/></button>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                    <span className="text-[8px] font-black uppercase text-green-500/60 tracking-widest">Nossas Faltas (Time)</span>
                    <div className="flex items-center gap-8">
                       <button onClick={() => updateFouls(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Minus size={16}/></button>
                       <span className="text-4xl font-display font-bold">{currentMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].fouls || 0}</span>
                       <button onClick={() => updateFouls(1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Plus size={16}/></button>
                    </div>
                 </div>
              </div>

              {/* Lançamento por Atleta - Layout Horizontal Scroll */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Lançamento por Atleta ({activeQuadro})</h4>
                {currentMatch.roster?.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 p-10 rounded-[32px] text-center">
                    <p className="text-[10px] font-black uppercase text-white/20">Nenhum atleta convocado para o {activeQuadro}</p>
                    <button onClick={() => { setActiveStep('info'); setShowRosterModal(true); }} className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-[9px] font-bold uppercase hover:bg-white/20">Convocar Agora</button>
                  </div>
                ) : (
                  currentMatch.roster
                    ?.map(pid => players.find(p => p.id === pid)) // Map to objects
                    .filter((p): p is Player => !!p) // Safety filter
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // Sort Alphabetically
                    .map(player => {
                        const pid = player.id;
                        
                        const t1Events = currentMatch.stats!.tempo1.events.filter(e => e.playerId === pid);
                        const t2Events = currentMatch.stats!.tempo2.events.filter(e => e.playerId === pid);

                        const pEventsAccumulated = [
                          ...t1Events.filter(e => e.type !== 'FALTA' || currentTempo === 1),
                          ...t2Events.filter(e => e.type !== 'FALTA' || currentTempo === 2)
                        ];
                    
                    return (
                      <div key={pid} className="bg-[#0A0A0A] p-6 rounded-[28px] border border-white/[0.05] space-y-5">
                        <div className="flex justify-between items-start gap-2">
                           <div className="flex items-center gap-3 shrink-0">
                             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-sm border border-white/5 text-white/40 relative">
                                {player?.name?.charAt(0)}
                                {currentMatch.coach === player?.name && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F4BE02] rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                                        <UserCog size={10} className="text-black" />
                                    </div>
                                )}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-sm block tracking-tight uppercase leading-tight">{player?.name}</span>
                                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{player?.position} {currentMatch.coach === player?.name ? '(TÉCNICO)' : ''}</span>
                             </div>
                           </div>
                           <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 flex-1 justify-end min-w-0">
                              {pEventsAccumulated.map(e => (
                                <button key={e.id} onClick={() => removeEvent(e.id)} className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
                                  {getEventIcon(e.type)}
                                </button>
                              ))}
                           </div>
                        </div>

                        {/* Eventos em Colunas com Descrição e Scroll Horizontal */}
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                           <EventBtn icon={<Target size={18}/>} label="GOL" onClick={() => addEvent(pid, 'GOL')} />
                           <EventBtn icon={<Zap size={18}/>} label="ASSIST" onClick={() => addEvent(pid, 'ASSIST')} />
                           <EventBtn icon={<Square size={18} className="text-yellow-500" fill="currentColor" />} label="CA" onClick={() => addEvent(pid, 'AMARELO')} />
                           <EventBtn icon={<Square size={18} className="text-red-600" fill="currentColor" />} label="CV" onClick={() => addEvent(pid, 'VERMELHO')} />
                           <EventBtn icon={<AlertTriangle size={18} className="text-orange-400" />} label="FALTA" onClick={() => addEvent(pid, 'FALTA')} />
                           <EventBtn icon={<ShieldAlert size={18} className="text-red-500" />} label="CONTRA" onClick={() => addEvent(pid, 'GOL_CONTRA')} />
                           <EventBtn icon={<CheckCircle2 size={18} className="text-green-500" />} label="P. SOFRI" onClick={() => addEvent(pid, 'PENALTI_SOFRIDO')} />
                           <EventBtn icon={<MinusCircle size={18} className="text-red-500" />} label="P. COMETI" onClick={() => addEvent(pid, 'PENALTI_COMETIDO')} />
                           <EventBtn icon={<Ban size={18} className="text-white/20" />} label="P. PERD" onClick={() => addEvent(pid, 'PENALTI_PERDIDO')} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => setShowForm(false)}
                  className="w-full bg-[#F4BE02] text-black font-black py-5 rounded-[24px] uppercase tracking-widest shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all"
                >
                  Concluir Partida
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           
           {/* FILTROS DE PESQUISA */}
           <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Filter size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtros de Rodada</span>
             </div>
             
             {/* CAMPO DE BUSCA */}
             <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                    type="text" 
                    placeholder="BUSCAR ADVERSÁRIO..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#F4BE02]/50 transition-all text-white placeholder:text-white/20"
                />
             </div>

             <div className="relative">
                <select 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                >
                    {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
             </div>
           </div>

           {groupedMatches.length > 0 ? groupedMatches.map(([date, dayMatches]) => {
             // O "Adversário" é comum, pegamos do primeiro jogo
             const opponent = dayMatches[0]?.opponent || 'Adversário';
             const isFriendly = dayMatches[0]?.isFriendly;
             
             return (
               <div key={date} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-[#F4BE02]/50" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    {isFriendly && (
                        <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/20">Amistoso</span>
                    )}
                  </div>
                  
                  <div className="bg-[#0A0A0A] rounded-[32px] border border-white/[0.06] overflow-hidden p-2 space-y-2">
                     <div className="px-4 py-2 flex items-center justify-between">
                         <h3 className="text-sm font-display font-bold uppercase tracking-tight text-white/80">vs {opponent}</h3>
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleShareMatchDay(dayMatches)} 
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                            >
                                <Share2 size={14}/>
                            </button>
                            <button 
                                onClick={() => handleEditMatchGroup(dayMatches[0])} 
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10"
                            >
                                <Pencil size={14}/>
                            </button>
                         </div>
                     </div>
                     
                     {/* Lista os Jogos do Dia */}
                     {dayMatches.sort((a,b) => b.label.localeCompare(a.label)).map(m => { 
                        const score = calculateScore(m);
                        const mvpPlayer = getMVP(m);
                        
                        return (
                            <div key={m.id} className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 w-24">
                                        <div className="w-8 h-8 rounded-full bg-black border border-[#F4BE02]/30 p-0.5">
                                            <img src={HOME_TEAM_LOGO} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#F4BE02]">{m.label}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-display font-bold">{score.us}</span>
                                        <span className="text-xs text-white/20">x</span>
                                        <span className="text-xl font-display font-bold text-white/40">{score.them}</span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 w-24">
                                        {m.opponentLogo ? (
                                            <div className="w-8 h-8 rounded-full bg-black border border-white/10 p-0.5">
                                                <img src={m.opponentLogo} className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <Trophy size={16} className="text-white/20"/>
                                        )}
                                        <button onClick={() => setRatingMatchId(m.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-[#F4BE02]">
                                            <Star size={14} />
                                        </button>
                                    </div>
                                </div>

                                {(mvpPlayer || m.coach || m.referee) && (
                                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[7px] font-black uppercase text-[#F4BE02] flex items-center gap-1"><Crown size={8}/> Craque</span>
                                          <span className="text-[9px] font-bold text-white truncate">{mvpPlayer || '-'}</span>
                                       </div>
                                       <div className="flex flex-col gap-1 border-l border-white/5 pl-2">
                                          <span className="text-[7px] font-black uppercase text-white/30 flex items-center gap-1"><UserCog size={8}/> Técnico</span>
                                          <span className="text-[9px] font-bold text-white truncate">{m.coach || '-'}</span>
                                       </div>
                                       <div className="flex flex-col gap-1 border-l border-white/5 pl-2">
                                          <span className="text-[7px] font-black uppercase text-white/30 flex items-center gap-1"><Flag size={8}/> Árbitro</span>
                                          <span className="text-[9px] font-bold text-white truncate">{m.referee || '-'}</span>
                                       </div>
                                    </div>
                                )}
                            </div>
                        )
                     })}
                  </div>
               </div>
             )
           }) : (
             <div className="text-center py-24 opacity-10 flex flex-col items-center gap-4">
                <Trophy size={80} strokeWidth={0.5} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma rodada encontrada</p>
             </div>
           )}
        </div>
      )}

      {/* MODAL DE CONVOCAÇÃO */}
      {showRosterModal && currentMatch && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center animate-in fade-in duration-500 p-4">
           <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[40px] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight">ELENCO DO {activeQuadro}</h3>
                  <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">Seleção de Atletas</p>
                </div>
                <button onClick={() => setShowRosterModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-transform"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <button 
                  onClick={toggleSelectAll}
                  className="w-full p-4 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-between transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4BE02]/10 flex items-center justify-center text-[#F4BE02]">
                      <Users size={20} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest">SELECIONAR TODOS</span>
                  </div>
                </button>

                <div className="h-4"></div>

                {activePlayers.map(p => {
                  const isSelected = currentMatch.roster?.includes(p.id);
                  const isCoach = currentMatch.coach === p.name;

                  return (
                    <div 
                      key={p.id}
                      className={`w-full p-4 rounded-3xl border flex items-center justify-between transition-all duration-300 ${isSelected ? 'bg-[#F4BE02]/10 border-[#F4BE02]/40 text-[#F4BE02]' : 'bg-white/[0.02] border-white/5 text-white/20'}`}
                    >
                      <button 
                        className="flex-1 flex items-center gap-4 text-left"
                        onClick={() => {
                            const roster = currentMatch.roster || [];
                            const updatedRoster = roster.includes(p.id) ? roster.filter(id => id !== p.id) : [...roster, p.id];
                            updateMatchInGlobal({ ...currentMatch, roster: updatedRoster });
                        }}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${isSelected ? 'bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5'}`}>{p.name?.charAt(0)}</div>
                         <div className="flex-1">
                            <p className="font-bold text-sm tracking-tight text-white uppercase">{p.name}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                {p.position} {isCoach ? '• TÉCNICO' : ''}
                            </p>
                         </div>
                      </button>

                      <div className="flex items-center gap-3">
                        <button 
                            onClick={() => updateMatchInGlobal({ ...currentMatch, coach: currentMatch.coach === p.name ? '' : p.name })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isCoach ? 'bg-[#F4BE02] border-[#F4BE02] text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/20'}`}
                        >
                            <UserCog size={18} />
                        </button>
                        <button 
                            onClick={() => {
                                const roster = currentMatch.roster || [];
                                const updatedRoster = roster.includes(p.id) ? roster.filter(id => id !== p.id) : [...roster, p.id];
                                updateMatchInGlobal({ ...currentMatch, roster: updatedRoster });
                            }}
                            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#F4BE02] border-[#F4BE02] text-black' : 'border-white/10'}`}
                        >
                            {isSelected && <Check size={18} strokeWidth={4} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5">
                <button onClick={() => setShowRosterModal(false)} className="w-full py-5 bg-[#F4BE02] text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-yellow-500/20 active:scale-[0.98] transition-all">Confirmar Elenco</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE NOTAS COM MÚLTIPLOS AVALIADORES */}
      {ratingMatchId && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
           <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[40px] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">NOTAS</h3>
                        <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">Avaliação Individual</p>
                    </div>
                    <button onClick={() => { setRatingMatchId(null); setCurrentEvaluatorId(''); }} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-transform"><X size={24}/></button>
                </div>
                
                {/* SELETOR DE AVALIADOR */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F4BE02]">
                        <UserCheck size={16} />
                    </div>
                    <select
                        value={currentEvaluatorId}
                        onChange={(e) => setCurrentEvaluatorId(e.target.value)}
                        className="w-full bg-[#111] border border-[#F4BE02]/30 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold uppercase text-white outline-none focus:border-[#F4BE02] appearance-none"
                    >
                        <option value="">Quem está avaliando?</option>
                        {activePlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {!currentEvaluatorId ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                        <UserCheck size={48} />
                        <p className="text-xs font-black uppercase tracking-widest text-center">Selecione um avaliador<br/>para começar</p>
                    </div>
                ) : (
                    players.filter(p => matches.find(m => m.id === ratingMatchId)?.roster?.includes(p.id)).map(p => {
                        // Nota específica deste avaliador
                        const myRating = getMyRatingForPlayer(p.id);
                        
                        // Média Geral
                        const average = matches.find(m => m.id === ratingMatchId)?.playerRatings?.[p.id] || 0;

                        return (
                            <div key={p.id} className="p-5 rounded-[28px] bg-white/[0.02] border border-white/5 flex items-center justify-between transition-all hover:bg-white/[0.04]">
                                <div>
                                    <span className="font-bold text-sm block tracking-tight uppercase">{p.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{p.position}</span>
                                        {average > 0 && (
                                            <span className="text-[8px] font-black uppercase text-[#F4BE02] tracking-widest bg-[#F4BE02]/10 px-1.5 py-0.5 rounded">Média: {average.toFixed(1)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleRatePlayer(p.id, Math.max(0, myRating - 0.5))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><Minus size={16}/></button>
                                    <div className={`w-12 text-center font-display font-bold text-xl ${myRating >= 8 ? 'text-green-500' : myRating >= 6 ? 'text-[#F4BE02]' : 'text-white/40'}`}>
                                        {myRating.toFixed(1)}
                                    </div>
                                    <button onClick={() => handleRatePlayer(p.id, Math.min(10, myRating + 0.5))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><Plus size={16}/></button>
                                </div>
                            </div>
                        )
                    })
                )}
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => {
                    setRatingMatchId(null);
                    setCurrentEvaluatorId('');
                  }}
                  className="w-full py-5 bg-[#F4BE02] text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
                >
                  Concluir Notas
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const EventBtn = ({ icon, label, onClick }: any) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] active:scale-95 transition-all shrink-0 min-w-[100px]"
  >
     <div className="text-white/40">{icon}</div>
     <span className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center leading-none">{label}</span>
  </button>
);

export default Sumulas;
