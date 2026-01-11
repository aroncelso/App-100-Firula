import React, { useState, useMemo, useEffect } from 'react';
import { Match, Player, EventType, MatchEvent, HalfStats } from '../types';
import { 
  Plus, X, Calendar, Save, Minus, CheckCircle2, Pencil, 
  Trophy, Star, Crown, Users, Check, Square, ShieldAlert,
  Zap, Target, AlertTriangle, Trash2, ChevronRight, UserCheck,
  Ban, MinusCircle, AlertCircle, UserCog, Filter, ChevronDown
} from 'lucide-react';

interface Props {
  matches: Match[];
  players: Player[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

type QuadroType = 'Quadro 1' | 'Quadro 2';

const Sumulas: React.FC<Props> = ({ matches, players, setMatches }) => {
  const currentYear = new Date().getFullYear().toString();
  const [showForm, setShowForm] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const [tempRatings, setTempRatings] = useState<Record<string, number>>({});
  const [currentTempo, setCurrentTempo] = useState<1 | 2>(1);
  const [activeStep, setActiveStep] = useState<'info' | 'events'>('info');

  // --- LÓGICA DE FILTROS INTELIGENTES ---
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterQuadro, setFilterQuadro] = useState('Todos');

  // 1. Extrair Anos disponíveis com base nas partidas existentes
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
      if (m.date) {
        const y = String(m.date).split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    years.add(currentYear); // Sempre inclui o ano atual
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  // 2. Extrair Quadros disponíveis naquele ano selecionado
  const availableQuadros = useMemo(() => {
    const quadros = new Set<string>();
    matches.forEach(m => {
        const y = String(m.date).split('-')[0];
        if (y === filterYear) {
            quadros.add(m.label);
        }
    });
    // Sempre garante as opções padrão se não houver dados
    if (quadros.size === 0) {
        quadros.add('Quadro 1');
        quadros.add('Quadro 2');
    }
    return Array.from(quadros).sort();
  }, [matches, filterYear]);

  // 3. Filtrar as partidas
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
        const mYear = String(m.date).split('-')[0];
        const yearMatch = mYear === filterYear;
        const quadroMatch = filterQuadro === 'Todos' || m.label === filterQuadro;
        return yearMatch && quadroMatch;
    });
  }, [matches, filterYear, filterQuadro]);

  // Resetar quadro para 'Todos' se mudar de ano e o quadro não existir (opcional, mas boa UX)
  useEffect(() => {
      if (filterQuadro !== 'Todos' && !availableQuadros.includes(filterQuadro)) {
          setFilterQuadro('Todos');
      }
  }, [filterYear, availableQuadros]);

  // --------------------------------------

  const createEmptyHalf = (): HalfStats => ({ fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] });

  const [formMatch, setFormMatch] = useState<Partial<Match> & { roster: string[] }>({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    label: 'Quadro 2',
    stats: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
    notes: '',
    roster: [],
    coach: '',
    isFriendly: false,
    wo: 'none'
  });

  // Função interna para sincronizar o formMatch atual com o estado global de matches
  const syncMatchToGlobal = (updated: Partial<Match>) => {
    if (!updated.id) return;
    setMatches(prev => {
      const exists = prev.find(m => m.id === updated.id);
      if (exists) {
        return prev.map(m => m.id === updated.id ? { ...m, ...updated } as Match : m);
      }
      return [...prev, updated as Match];
    });
  };

  // Handlers
  const handleNewMatch = () => {
    setFormMatch({
      opponent: '',
      date: new Date().toISOString().split('T')[0],
      label: 'Quadro 2',
      stats: { tempo1: createEmptyHalf(), tempo2: createEmptyHalf() },
      notes: '',
      roster: [],
      coach: '',
      isFriendly: false,
      wo: 'none'
    });
    setActiveStep('info');
    setShowForm(true);
  };

  const handleEditMatch = (match: Match) => {
    setFormMatch({
      ...JSON.parse(JSON.stringify(match)),
      roster: match.roster || []
    });
    setActiveStep('info');
    setShowForm(true);
  };

  const handleGoToCampo = () => {
    if (!formMatch.opponent) return;
    
    // Gera ID se não existir e já insere no estado global para iniciar o sync
    const matchData = {
      ...formMatch,
      opponent: formMatch.opponent.toUpperCase(),
      notes: formMatch.notes?.toUpperCase(),
      id: formMatch.id || Date.now().toString(),
    } as Match;

    setFormMatch(matchData);
    syncMatchToGlobal(matchData);
    setActiveStep('events');
  };

  const addEvent = (playerId: string, type: EventType) => {
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    const newEvent: MatchEvent = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), playerId, type };
    
    setFormMatch(prev => {
      const stats = { ...prev.stats! };
      stats[tempoKey].events = [...stats[tempoKey].events, newEvent];
      
      if (type === 'FALTA') {
        stats[tempoKey].fouls = (stats[tempoKey].fouls || 0) + 1;
      }
      
      const updated = { ...prev, stats };
      // Sincroniza instantaneamente com o estado global para envio automático
      syncMatchToGlobal(updated);
      return updated;
    });
  };

  const removeEvent = (eventId: string) => {
    setFormMatch(prev => {
      const stats = { ...prev.stats! };
      
      // Busca em qual tempo o evento está (T1 ou T2)
      let foundInT1 = stats.tempo1.events.find(e => e.id === eventId);
      let foundInT2 = stats.tempo2.events.find(e => e.id === eventId);

      if (foundInT1) {
        if (foundInT1.type === 'FALTA') {
          stats.tempo1.fouls = Math.max(0, (stats.tempo1.fouls || 0) - 1);
        }
        stats.tempo1.events = stats.tempo1.events.filter(e => e.id !== eventId);
      } else if (foundInT2) {
        if (foundInT2.type === 'FALTA') {
          stats.tempo2.fouls = Math.max(0, (stats.tempo2.fouls || 0) - 1);
        }
        stats.tempo2.events = stats.tempo2.events.filter(e => e.id !== eventId);
      }
      
      const updated = { ...prev, stats };
      syncMatchToGlobal(updated);
      return updated;
    });
  };

  const updateOpponentStats = (field: 'opponentGoals' | 'opponentFouls', delta: number) => {
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    setFormMatch(prev => {
      const stats = { ...prev.stats! };
      const currentVal = stats[tempoKey][field] || 0;
      stats[tempoKey][field] = Math.max(0, currentVal + delta);
      const updated = { ...prev, stats };
      syncMatchToGlobal(updated);
      return updated;
    });
  };

  const updateFouls = (delta: number) => {
    const tempoKey = currentTempo === 1 ? 'tempo1' : 'tempo2';
    setFormMatch(prev => {
      const stats = { ...prev.stats! };
      const currentVal = stats[tempoKey].fouls || 0;
      stats[tempoKey].fouls = Math.max(0, currentVal + delta);
      const updated = { ...prev, stats };
      syncMatchToGlobal(updated);
      return updated;
    });
  };

  const saveMatch = () => {
    if (!formMatch.opponent) return;
    const matchData = {
      ...formMatch,
      opponent: formMatch.opponent.toUpperCase(),
      notes: formMatch.notes?.toUpperCase(),
      id: formMatch.id || Date.now().toString(),
    } as Match;

    syncMatchToGlobal(matchData);
    setShowForm(false);
  };

  const calculateScore = (m: Match | Partial<Match>) => {
    if (!m.stats) return { us: 0, them: 0 };
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

  // USA filteredMatches aqui para o agrupamento
  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      const dateKey = m.date || 'Sem Data';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredMatches]);

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
    const currentRoster = formMatch.roster || [];
    const selectablePlayers = players.filter(p => p.active !== false);
    
    if (currentRoster.length === selectablePlayers.length) {
      setFormMatch(prev => {
          const updated = { ...prev, roster: [] };
          syncMatchToGlobal(updated);
          return updated;
      });
    } else {
      setFormMatch(prev => {
          const updated = { ...prev, roster: selectablePlayers.map(p => p.id) };
          syncMatchToGlobal(updated);
          return updated;
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Somente exibe cabeçalho na lista principal */}
      {!showForm && (
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-display font-bold">SÚMULAS</h2>
            <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">Controle de Partidas</p>
          </div>
          <button 
            onClick={handleNewMatch}
            className="bg-[#F4BE02] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-500/20"
          >
            <Plus size={14} /> Novo Jogo
          </button>
        </div>
      )}

      {showForm ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Menu de Etapas do Form */}
          <div className="flex gap-2">
            <button onClick={() => setActiveStep('info')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeStep === 'info' ? 'bg-[#F4BE02] text-black shadow-lg' : 'bg-white/5 text-white/30'}`}>1. Informações</button>
            <button onClick={handleGoToCampo} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeStep === 'events' ? 'bg-[#F4BE02] text-black shadow-lg' : 'bg-white/5 text-white/30'}`}>2. Súmula de Campo</button>
          </div>

          {activeStep === 'info' ? (
            <div className="bg-[#0A0A0A] p-6 rounded-[32px] border border-white/10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Nome do Adversário</label>
                  <input 
                    type="text" 
                    placeholder="Nome do Time" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:border-[#F4BE02]/50 transition-all text-sm uppercase"
                    value={formMatch.opponent}
                    onChange={e => setFormMatch({...formMatch, opponent: e.target.value.toUpperCase()})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none text-white/60 text-xs"
                      value={formMatch.date}
                      onChange={e => setFormMatch({...formMatch, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Quadro</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none text-white/60 text-xs appearance-none"
                      value={formMatch.label}
                      onChange={e => setFormMatch({...formMatch, label: e.target.value as QuadroType})}
                    >
                      <option value="Quadro 1">Quadro 1</option>
                      <option value="Quadro 2">Quadro 2</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                    onClick={() => setShowRosterModal(true)}
                    className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center gap-2 group active:scale-95 transition-all"
                  >
                    <Users size={18} className="text-[#F4BE02]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Convocar ({formMatch.roster?.length || 0})</span>
                  </button>
                  <button 
                    onClick={() => {
                        const val = !formMatch.isFriendly;
                        setFormMatch({...formMatch, isFriendly: val});
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${formMatch.isFriendly ? 'bg-[#F4BE02]/10 border-[#F4BE02]/40 text-[#F4BE02]' : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                    <Star size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{formMatch.isFriendly ? 'Amistoso' : 'Oficial'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Notas da Partida</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-medium outline-none text-xs uppercase"
                    value={formMatch.notes}
                    onChange={e => setFormMatch({...formMatch, notes: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40">Cancelar</button>
                 <button onClick={handleGoToCampo} className="flex-[2] py-4 bg-[#F4BE02] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-500/10">Ir para Campo</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              {/* Placar Real-Time */}
              <div className="bg-[#111] p-6 rounded-[32px] border border-white/10 flex items-center justify-around relative overflow-hidden">
                <div className="flex flex-col items-center gap-2 w-24">
                    <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-10 h-10 object-contain" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">100 Firula</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-5xl font-display font-bold">{calculateScore(formMatch).us}</span>
                    <span className="text-xl font-display text-white/20">x</span>
                    <span className="text-5xl font-display font-bold text-white/40">{calculateScore(formMatch).them}</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-24">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Trophy size={20} className="text-white/20"/></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 truncate w-full text-center">{formMatch.opponent || 'Oponente'}</span>
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
                          <span className="text-2xl font-display font-bold">{formMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].opponentGoals || 0}</span>
                          <button onClick={() => updateOpponentStats('opponentGoals', 1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Plus size={12}/></button>
                       </div>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                       <span className="text-[8px] font-black uppercase text-yellow-500/60">Faltas Deles</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => updateOpponentStats('opponentFouls', -1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Minus size={12}/></button>
                          <span className="text-2xl font-display font-bold">{formMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].opponentFouls || 0}</span>
                          <button onClick={() => updateOpponentStats('opponentFouls', 1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Plus size={12}/></button>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                    <span className="text-[8px] font-black uppercase text-green-500/60 tracking-widest">Nossas Faltas (Time)</span>
                    <div className="flex items-center gap-8">
                       <button onClick={() => updateFouls(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Minus size={16}/></button>
                       <span className="text-4xl font-display font-bold">{formMatch.stats![currentTempo === 1 ? 'tempo1' : 'tempo2'].fouls || 0}</span>
                       <button onClick={() => updateFouls(1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Plus size={16}/></button>
                    </div>
                 </div>
              </div>

              {/* Lançamento por Atleta - Layout Horizontal Scroll */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Lançamento por Atleta</h4>
                {formMatch.roster?.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 p-10 rounded-[32px] text-center">
                    <p className="text-[10px] font-black uppercase text-white/20">Nenhum atleta convocado</p>
                  </div>
                ) : (
                  formMatch.roster?.map(pid => {
                    const player = players.find(p => p.id === pid);
                    
                    // Lógica para mostrar GOLS, CARTÕES e ASSISTÊNCIAS independente do tempo
                    // SOMENTE FALTAS respeitam o tempo atual
                    const t1Events = formMatch.stats!.tempo1.events.filter(e => e.playerId === pid);
                    const t2Events = formMatch.stats!.tempo2.events.filter(e => e.playerId === pid);

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
                                {formMatch.coach === player?.name && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F4BE02] rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                                        <UserCog size={10} className="text-black" />
                                    </div>
                                )}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-sm block tracking-tight uppercase leading-tight">{player?.name}</span>
                                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{player?.position} {formMatch.coach === player?.name ? '(TÉCNICO)' : ''}</span>
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

              <button 
                onClick={() => setShowForm(false)}
                className="w-full bg-[#F4BE02] text-black font-black py-5 rounded-[24px] uppercase tracking-widest shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all"
              >
                Concluir e Voltar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           
           {/* FILTROS DE PESQUISA (SÓ APARECE QUANDO FORM ESTÁ FECHADO) */}
           <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Filter size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtros de Súmula</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
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
                <div className="relative">
                    <select 
                        value={filterQuadro} 
                        onChange={e => setFilterQuadro(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        <option value="Todos" className="text-black bg-white">Todos</option>
                        {availableQuadros.map(q => <option key={q} value={q} className="text-black bg-white">{q}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
             </div>
           </div>

           {groupedMatches.length > 0 ? groupedMatches.map(([date, dayMatches]) => {
             return (
               <div key={date} className="space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <Calendar size={14} className="text-[#F4BE02]/50" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                      {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid gap-4">
                     {dayMatches.map(m => {
                       const score = calculateScore(m);
                       const mvp = getMVP(m);
                       return (
                         <div key={m.id} className="bg-[#0A0A0A] rounded-[32px] border border-white/[0.06] overflow-hidden group hover:border-white/20 transition-all shadow-xl">
                            <div className="p-4 flex justify-between items-center bg-white/[0.02] border-b border-white/[0.04]">
                               <div className="flex items-center gap-3">
                                  <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-white/50 uppercase tracking-widest">{m.label}</div>
                                  {m.isFriendly && <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-500 uppercase tracking-widest">Amistoso</div>}
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => setRatingMatchId(m.id)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-[#F4BE02] transition-all active:scale-90"><Star size={16}/></button>
                                  <button onClick={() => handleEditMatch(m)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90"><Pencil size={16}/></button>
                               </div>
                            </div>
                            
                            <div className="p-8 flex items-center justify-between relative overflow-hidden">
                               <div className="flex flex-col items-center gap-2 w-24 text-center">
                                  <div className="w-14 h-14 rounded-full bg-black border border-[#F4BE02]/30 p-2 shadow-2xl relative">
                                    <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">100 Firula</span>
                               </div>

                               <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-6">
                                    <span className="text-5xl font-display font-bold text-white leading-none">{score.us}</span>
                                    <div className="h-10 w-[1px] bg-white/10"></div>
                                    <span className="text-5xl font-display font-bold text-white/20 leading-none">{score.them}</span>
                                  </div>
                               </div>

                               <div className="flex flex-col items-center gap-2 w-24 text-center">
                                  <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shadow-2xl">
                                    <Trophy size={24} className="text-white/10" />
                                  </div>
                                  <span className="text-[9px] font-black uppercase text-white/30 tracking-widest truncate w-full">{m.opponent}</span>
                               </div>
                            </div>

                            {mvp && (
                              <div className="px-6 py-4 border-t border-white/[0.03] flex items-center justify-between bg-[#F4BE02]/5">
                                <div className="flex items-center gap-2">
                                    <Crown size={14} className="text-[#F4BE02]" />
                                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Craque do Jogo</span>
                                </div>
                                <span className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">{mvp}</span>
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
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem Jogos Registrados para este filtro</p>
             </div>
           )}
        </div>
      )}

      {/* Modal de Convocação */}
      {showRosterModal && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center animate-in fade-in duration-500 p-4">
           <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[40px] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight">CONVOCAÇÃO</h3>
                  <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">Quem entrou em campo?</p>
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
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${(formMatch.roster?.length || 0) === players.filter(p => p.active !== false).length ? 'bg-[#F4BE02] border-[#F4BE02] text-black' : 'border-white/10'}`}>
                    {(formMatch.roster?.length || 0) === players.filter(p => p.active !== false).length && <Check size={14} strokeWidth={4} />}
                  </div>
                </button>

                <div className="h-4"></div>

                {players.filter(p => p.active !== false).sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(p => {
                  const isSelected = formMatch.roster?.includes(p.id);
                  const isCoach = formMatch.coach === p.name;

                  return (
                    <div 
                      key={p.id}
                      className={`w-full p-4 rounded-3xl border flex items-center justify-between transition-all duration-300 ${isSelected ? 'bg-[#F4BE02]/10 border-[#F4BE02]/40 text-[#F4BE02]' : 'bg-white/[0.02] border-white/5 text-white/20'}`}
                    >
                      <button 
                        className="flex-1 flex items-center gap-4 text-left"
                        onClick={() => {
                            setFormMatch(prev => {
                                const roster = prev.roster || [];
                                const updatedRoster = roster.includes(p.id) 
                                    ? roster.filter(id => id !== p.id) 
                                    : [...roster, p.id];
                                
                                const updated = { ...prev, roster: updatedRoster };
                                syncMatchToGlobal(updated);
                                return updated;
                            });
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
                        {/* Botão de Selecionar Técnico */}
                        <button 
                            onClick={() => {
                                setFormMatch(prev => {
                                    const coachName = prev.coach === p.name ? '' : p.name;
                                    const updated = { ...prev, coach: coachName };
                                    syncMatchToGlobal(updated);
                                    return updated;
                                });
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isCoach ? 'bg-[#F4BE02] border-[#F4BE02] text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 border-white/10 text-white/20'}`}
                            title="Marcar como Técnico"
                        >
                            <UserCog size={18} />
                        </button>
                        
                        {/* Checkbox de Convocação */}
                        <button 
                            onClick={() => {
                                setFormMatch(prev => {
                                    const roster = prev.roster || [];
                                    const updatedRoster = roster.includes(p.id) 
                                        ? roster.filter(id => id !== p.id) 
                                        : [...roster, p.id];
                                    
                                    const updated = { ...prev, roster: updatedRoster };
                                    syncMatchToGlobal(updated);
                                    return updated;
                                });
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

      {/* Modal de Notas */}
      {ratingMatchId && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
           <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[40px] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">NOTAS DO JOGO</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#F4BE02] font-black">Avaliação Individual</p>
                </div>
                <button onClick={() => setRatingMatchId(null)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-transform"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {players.filter(p => matches.find(m => m.id === ratingMatchId)?.roster?.includes(p.id)).map(p => {
                  const rating = (tempRatings[p.id] || (matches.find(m => m.id === ratingMatchId)?.playerRatings?.[p.id]) || 0);
                  return (
                    <div key={p.id} className="p-5 rounded-[28px] bg-white/[0.02] border border-white/5 flex items-center justify-between transition-all hover:bg-white/[0.04]">
                       <div>
                            <span className="font-bold text-sm block tracking-tight uppercase">{p.name}</span>
                            <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{p.position}</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <button onClick={() => {
                           const newVal = Math.max(0, rating - 0.5);
                           setTempRatings({...tempRatings, [p.id]: newVal});
                         }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><Minus size={16}/></button>
                         <div className={`w-14 text-center font-display font-bold text-xl ${rating >= 8 ? 'text-green-500' : rating >= 6 ? 'text-[#F4BE02]' : 'text-white/40'}`}>
                            {rating.toFixed(1)}
                         </div>
                         <button onClick={() => {
                           const newVal = Math.min(10, rating + 0.5);
                           setTempRatings({...tempRatings, [p.id]: newVal});
                         }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><Plus size={16}/></button>
                       </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => {
                    setMatches(prev => prev.map(m => m.id === ratingMatchId ? { ...m, playerRatings: { ...m.playerRatings, ...tempRatings } } : m));
                    setRatingMatchId(null);
                    setTempRatings({});
                  }}
                  className="w-full py-5 bg-[#F4BE02] text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
                >
                  Confirmar Notas
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