
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Match } from '../types';
import { Target, Shield, Zap, Search, UserPlus, Users, Crown, Star, Square, ShieldAlert, Swords, Filter, Calendar, Check, Layers, User } from 'lucide-react';

interface Props {
  players: Player[];
  matches: Match[];
  onAddPlayer: () => void;
}

const Players: React.FC<Props> = ({ players, matches, onAddPlayer }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Filter States ---
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedQuadros, setSelectedQuadros] = useState<string[]>(['Quadro 1', 'Quadro 2']);

  // Extract available years from matches
  const availableYears = useMemo(() => {
    const years = new Set(matches.map(m => m.date.split('-')[0]));
    years.add(currentYear); // Ensure current year is always an option
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, searchTerm]);

  const getPositionStyle = (pos: Player['position']) => {
    switch (pos) {
      case 'Atacante': return { bg: 'bg-[#E70205]/10', text: 'text-[#E70205]', char: 'A' };
      case 'Meio-Campo': return { bg: 'bg-[#F4BE02]/10', text: 'text-[#F4BE02]', char: 'M' };
      case 'Zagueiro': return { bg: 'bg-blue-500/10', text: 'text-blue-500', char: 'Z' };
      case 'Goleiro': return { bg: 'bg-green-500/10', text: 'text-green-500', char: 'G' };
    }
  };

  const toggleQuadro = (quadro: string) => {
    if (quadro === 'all') {
        setSelectedQuadros(['Quadro 1', 'Quadro 2']);
        return;
    }
    
    setSelectedQuadros(prev => {
        if (prev.includes(quadro)) {
            // Prevent deselecting everything? Let's allow it, stats will be 0.
            return prev.filter(q => q !== quadro);
        } else {
            return [...prev, quadro];
        }
    });
  };

  const calculateStats = (playerId: string) => {
    let stats = {
      matches: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      mvpCount: 0,
      totalRating: 0,
      ratedMatches: 0
    };

    matches.forEach(match => {
      // --- FILTERS CHECK ---
      const matchYear = match.date.split('-')[0];
      if (matchYear !== selectedYear) return; // Filter by Year

      if (!selectedQuadros.includes(match.label)) return; // Filter by Quadro

      // --- LOGIC ---
      // 1. Check Participation
      const inRoster = match.roster?.includes(playerId);
      const hasRating = match.playerRatings && match.playerRatings[playerId] !== undefined;
      const hasEventInT1 = match.stats.tempo1.events.some(e => e.playerId === playerId);
      const hasEventInT2 = match.stats.tempo2.events.some(e => e.playerId === playerId);

      if (inRoster || hasRating || hasEventInT1 || hasEventInT2) {
        stats.matches++;
      }

      // 2. Events
      const processHalf = (half: any) => {
         half.events.forEach((e: any) => {
            if (e.playerId === playerId) {
              if (e.type === 'GOL') stats.goals++;
              if (e.type === 'ASSIST') stats.assists++;
              if (e.type === 'FALTA') stats.fouls++;
              if (e.type === 'AMARELO') stats.yellowCards++;
              if (e.type === 'VERMELHO') stats.redCards++;
            }
         });
      };
      processHalf(match.stats.tempo1);
      processHalf(match.stats.tempo2);

      // 3. MVP & Rating
      if (match.playerRatings) {
        let maxScore = -1;
        let mvpId = null;
        Object.entries(match.playerRatings).forEach(([pid, score]) => {
           const numericScore = score as number;
           if (numericScore > maxScore) { maxScore = numericScore; mvpId = pid; }
        });
        if (mvpId === playerId) stats.mvpCount++;

        const rating = match.playerRatings[playerId];
        if (rating !== undefined) {
           stats.totalRating += rating;
           stats.ratedMatches++;
        }
      }
    });

    const avgRating = stats.ratedMatches > 0 ? (stats.totalRating / stats.ratedMatches).toFixed(1) : '-';
    return { ...stats, avgRating };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-2xl font-display font-bold tracking-tight">ELENCO</h2>
        <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">{players.length} ATLETAS DISPONÍVEIS</p>
      </div>

      {/* Tabs */}
      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
             activeTab === 'list' 
             ? 'bg-[#F4BE02] text-black shadow-lg' 
             : 'text-white/30 hover:bg-white/5'
          }`}
        >
          <Users size={14} /> Jogadores
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
             activeTab === 'stats' 
             ? 'bg-[#F4BE02] text-black shadow-lg' 
             : 'text-white/30 hover:bg-white/5'
          }`}
        >
          <Target size={14} /> Estatísticas
        </button>
      </div>

      {/* --- FILTERS SECTION (Only in Stats Tab) --- */}
      {activeTab === 'stats' && (
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Year Selector */}
              <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                      <Calendar size={10} className="text-[#F4BE02]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Temporada</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {availableYears.map(year => (
                          <button
                              key={year}
                              onClick={() => setSelectedYear(year)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                  selectedYear === year 
                                  ? 'bg-white text-black' 
                                  : 'bg-white/5 text-white/40 hover:bg-white/10'
                              }`}
                          >
                              {year}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Quadro Selector */}
              <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                      <Layers size={10} className="text-[#F4BE02]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Quadros</span>
                  </div>
                  <div className="flex gap-2">
                      <button
                          onClick={() => toggleQuadro('all')}
                          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${
                              selectedQuadros.length === 2
                              ? 'bg-[#F4BE02]/10 border-[#F4BE02] text-[#F4BE02]' 
                              : 'bg-white/5 border-transparent text-white/40'
                          }`}
                      >
                         <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${selectedQuadros.length === 2 ? 'border-[#F4BE02] bg-[#F4BE02]' : 'border-white/30'}`}>
                             {selectedQuadros.length === 2 && <Check size={8} className="text-black" strokeWidth={4} />}
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-widest">Todos</span>
                      </button>

                      {['Quadro 1', 'Quadro 2'].map(q => {
                          const isActive = selectedQuadros.includes(q);
                          return (
                              <button
                                  key={q}
                                  onClick={() => toggleQuadro(q)}
                                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${
                                      isActive
                                      ? 'bg-white/[0.08] border-white/40 text-white' 
                                      : 'bg-white/5 border-transparent text-white/40'
                                  }`}
                              >
                                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isActive ? 'border-[#F4BE02] bg-[#F4BE02]' : 'border-white/30'}`}>
                                     {isActive && <Check size={8} className="text-black" strokeWidth={4} />}
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest">{q}</span>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* Shared Search Bar */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F4BE02] transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder={activeTab === 'list' ? "BUSCAR JOGADOR..." : "FILTRAR RESULTADOS..."}
          className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-[20px] py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#F4BE02]/40 transition-all placeholder:text-white/10"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content Area */}
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* --- TAB: LIST --- */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Add New Button */}
            <button 
              onClick={onAddPlayer}
              className="w-full bg-white/[0.03] border border-dashed border-white/20 hover:border-[#F4BE02] hover:bg-[#F4BE02]/5 text-white/40 hover:text-[#F4BE02] p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F4BE02] group-hover:text-black transition-colors">
                <UserPlus size={16} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Cadastrar Novo Atleta</span>
            </button>

            {filteredPlayers.length > 0 ? filteredPlayers.map(player => {
              const style = getPositionStyle(player.position);
              return (
                <div key={player.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex items-center justify-between hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-center font-display font-bold text-lg text-white/80">
                        {player.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md ${style.bg} ${style.text} flex items-center justify-center text-[9px] font-black border border-white/5`}>
                        {style.char}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-white">{player.name}</h4>
                      <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-0.5">{player.position}</p>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center text-white/20">
                     <User size={14} />
                  </div>
                </div>
              )
            }) : (
              <EmptyState message="Nenhum jogador encontrado" />
            )}
          </div>
        )}

        {/* --- TAB: STATISTICS --- */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {filteredPlayers.length > 0 ? filteredPlayers.map(player => {
              const style = getPositionStyle(player.position);
              const stats = calculateStats(player.id);
              
              return (
                <div key={player.id} className="bg-[#0A0A0A] p-5 rounded-[24px] border border-white/[0.06] hover:border-white/20 transition-all shadow-lg">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-center font-display font-bold text-lg">
                        {player.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md ${style.bg} ${style.text} flex items-center justify-center text-[9px] font-black border border-white/5`}>
                        {style.char}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-base tracking-tight text-white">{player.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">{player.position}</span>
                         {Number(stats.avgRating) > 0 && (
                            <div className="flex items-center gap-1 bg-[#F4BE02]/10 px-1.5 py-0.5 rounded text-[#F4BE02]">
                                <Star size={8} fill="currentColor"/>
                                <span className="text-[8px] font-bold">{stats.avgRating}</span>
                            </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <StatBox icon={<Swords size={12}/>} label="Jogos" value={stats.matches} />
                    <StatBox icon={<Target size={12} className="text-green-500"/>} label="Gols" value={stats.goals} highlight={stats.goals > 0} />
                    <StatBox icon={<Zap size={12} className="text-[#F4BE02]"/>} label="Assis." value={stats.assists} highlight={stats.assists > 0} />
                    <StatBox icon={<ShieldAlert size={12} className="text-red-400"/>} label="Faltas" value={stats.fouls} />
                    
                    <StatBox icon={<Square size={10} fill="#EAB308" className="text-yellow-500"/>} label="Amarelo" value={stats.yellowCards} />
                    <StatBox icon={<Square size={10} fill="#EF4444" className="text-red-500"/>} label="Vermelho" value={stats.redCards} />
                    <StatBox icon={<Crown size={12} fill={stats.mvpCount > 0 ? "#F4BE02" : "none"} className={stats.mvpCount > 0 ? "text-[#F4BE02]" : "text-white/30"}/>} label="MVP" value={stats.mvpCount} highlight={stats.mvpCount > 0} />
                    <StatBox icon={<Star size={12} fill={stats.avgRating !== '-' ? "currentColor" : "none"} className="text-[#F4BE02]"/>} label="Média" value={stats.avgRating} />
                  </div>
                </div>
              );
            }) : (
              <EmptyState message="Nenhuma estatística encontrada" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value, highlight }: any) => (
  <div className={`bg-white/[0.02] rounded-xl p-2 flex flex-col items-center justify-center gap-1 border ${highlight ? 'border-white/10 bg-white/[0.04]' : 'border-transparent'}`}>
    <div className="opacity-80">{icon}</div>
    <span className={`text-sm font-display font-bold leading-none ${highlight ? 'text-white' : 'text-white/60'}`}>{value}</span>
    <span className="text-[7px] font-black uppercase tracking-widest text-white/20">{label}</span>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 opacity-10">
    <Users size={64} className="mx-auto mb-4" strokeWidth={1} />
    <p className="text-[10px] font-black uppercase tracking-[0.3em]">{message}</p>
  </div>
);

export default Players;
