
import React, { useState, useMemo } from 'react';
import { Player, Match } from '../types';
import { 
  Target, 
  Search, 
  UserPlus, 
  Users, 
  Star, 
  Square, 
  ShieldAlert, 
  Zap, 
  Pencil, 
  MessageCircle, 
  Eye, 
  EyeOff,
  Trophy,
  Activity,
  Filter,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

interface Props {
  players: Player[];
  matches: Match[];
  onAddPlayer: () => void;
  onEditPlayer: (player: Player) => void;
}

type SortKey = 'goals' | 'assists' | 'matches' | 'yellow' | 'red' | 'rating' | 'name';

const Players: React.FC<Props> = ({ players, matches, onAddPlayer, onEditPlayer }) => {
  const currentYear = new Date().getFullYear().toString();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Filtros SoFascore
  const [selectedYears, setSelectedYears] = useState<string[]>([currentYear]);
  const [selectedQuadros, setSelectedQuadros] = useState<string[]>(['Quadro 1', 'Quadro 2']);
  const [sortBy, setSortBy] = useState<SortKey>('rating');

  // Extrair anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    matches.forEach(m => {
      if (m.date) years.add(m.date.split('-')[0]);
    });
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [matches, currentYear]);

  // Cálculo de estatísticas filtradas
  const playerFullStats = useMemo(() => {
    const statsMap = new Map();

    players.forEach(p => {
      statsMap.set(p.id, {
        goals: 0,
        assists: 0,
        matches: 0,
        yellow: 0,
        red: 0,
        ratings: [] as number[],
      });
    });

    // Filtrar partidas antes de processar
    const filteredMatches = matches.filter(m => {
      const matchYear = m.date ? m.date.split('-')[0] : '';
      const yearMatch = selectedYears.includes(matchYear);
      const quadroMatch = selectedQuadros.includes(m.label);
      return yearMatch && quadroMatch;
    });

    filteredMatches.forEach(m => {
      players.forEach(p => {
        const inRoster = m.roster?.includes(p.id);
        const hasRating = m.playerRatings && m.playerRatings[p.id] !== undefined;
        const allEvents = [...m.stats.tempo1.events, ...m.stats.tempo2.events];
        const hasEvents = allEvents.some(e => e.playerId === p.id);

        if (inRoster || hasRating || hasEvents) {
          const s = statsMap.get(p.id);
          if (s) {
            s.matches++;
            if (hasRating) s.ratings.push(m.playerRatings![p.id]);
          }
        }
      });

      const allEvents = [...m.stats.tempo1.events, ...m.stats.tempo2.events];
      allEvents.forEach(e => {
        const s = statsMap.get(e.playerId);
        if (s) {
          if (e.type === 'GOL') s.goals++;
          if (e.type === 'ASSIST') s.assists++;
          if (e.type === 'AMARELO') s.yellow++;
          if (e.type === 'VERMELHO') s.red++;
        }
      });
    });

    // Calcular médias finais
    const finalStats = new Map();
    statsMap.forEach((val, key) => {
      const avg = val.ratings.length > 0 
        ? parseFloat((val.ratings.reduce((a: number, b: number) => a + b, 0) / val.ratings.length).toFixed(1))
        : 0;
      finalStats.set(key, { ...val, avgRating: avg });
    });

    return finalStats;
  }, [players, matches, selectedYears, selectedQuadros]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = showOnlyActive ? p.active !== false : true;
        return nameMatch && statusMatch && (p.name && p.name.trim().length > 0);
      })
      .sort((a, b) => {
        if (activeTab === 'stats') {
          const sA = playerFullStats.get(a.id);
          const sB = playerFullStats.get(b.id);
          
          if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
          if (sortBy === 'rating') return (sB?.avgRating || 0) - (sA?.avgRating || 0);
          return (sB?.[sortBy] || 0) - (sA?.[sortBy] || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [players, searchTerm, showOnlyActive, activeTab, playerFullStats, sortBy]);

  const toggleFilter = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const getPositionStyle = (pos: string) => {
    switch (pos) {
      case 'Atacante': return { bg: 'bg-red-500/10', text: 'text-red-500', char: 'A' };
      case 'Meio-Campo': return { bg: 'bg-[#F4BE02]/10', text: 'text-[#F4BE02]', char: 'M' };
      case 'Zagueiro': return { bg: 'bg-blue-500/10', text: 'text-blue-500', char: 'Z' };
      case 'Goleiro': return { bg: 'bg-green-500/10', text: 'text-green-500', char: 'G' };
      default: return { bg: 'bg-white/10', text: 'text-white', char: '?' };
    }
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* HEADER E TABS */}
      <div className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold">ELENCO</h2>
          <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">
            {players.filter(p => p.active !== false).length} Ativos / {players.length} Total
          </p>
        </div>
        <button 
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${showOnlyActive ? 'bg-[#F4BE02]/10 text-[#F4BE02] border-[#F4BE02]/20' : 'bg-white/5 text-white/40 border-white/10'}`}
        >
          {showOnlyActive ? <Eye size={12} /> : <EyeOff size={12} />}
          {showOnlyActive ? 'Ativos' : 'Todos'}
        </button>
      </div>

      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-2 gap-2">
        <TabBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<Users size={14}/>} label="Lista" />
        <TabBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Target size={14}/>} label="SoFascore" />
      </div>

      {/* FILTROS DINÂMICOS (APENAS NA ABA STATS) */}
      {activeTab === 'stats' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Filter size={12} className="text-[#F4BE02]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Filtros de Estatística</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => toggleFilter(selectedYears, year, setSelectedYears)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    selectedYears.includes(year) 
                    ? 'bg-[#F4BE02] text-black border-[#F4BE02]' 
                    : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {['Quadro 1', 'Quadro 2'].map(q => (
                <button
                  key={q}
                  onClick={() => toggleFilter(selectedQuadros, q, setSelectedQuadros)}
                  className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    selectedQuadros.includes(q) 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* ORDENAÇÃO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
             <div className="flex items-center gap-1.5 mr-2 shrink-0">
                <ArrowUpDown size={12} className="text-white/20" />
                <span className="text-[8px] font-black text-white/20 uppercase">Order:</span>
             </div>
             <SortChip active={sortBy === 'rating'} label="Nota" onClick={() => setSortBy('rating')} />
             <SortChip active={sortBy === 'goals'} label="Gols" onClick={() => setSortBy('goals')} />
             <SortChip active={sortBy === 'assists'} label="Assis" onClick={() => setSortBy('assists')} />
             <SortChip active={sortBy === 'matches'} label="Jogos" onClick={() => setSortBy('matches')} />
             <SortChip active={sortBy === 'yellow'} label="CA" onClick={() => setSortBy('yellow')} />
             <SortChip active={sortBy === 'red'} label="CV" onClick={() => setSortBy('red')} />
             <SortChip active={sortBy === 'name'} label="A-Z" onClick={() => setSortBy('name')} />
          </div>
        </div>
      )}

      {/* BUSCA */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input 
          type="text"
          placeholder="BUSCAR NO ELENCO..."
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:border-[#F4BE02] outline-none transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA DE ATLETAS */}
      <div className="pb-32 space-y-4">
        {activeTab === 'list' && (
          <button 
            onClick={onAddPlayer}
            className="w-full bg-white/5 border border-dashed border-white/20 p-5 rounded-3xl flex items-center justify-center gap-3 text-white/40 hover:text-[#F4BE02] hover:border-[#F4BE02] transition-all"
          >
            <UserPlus size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Novo Atleta</span>
          </button>
        )}

        {filteredPlayers.length > 0 ? filteredPlayers.map(p => {
          const style = getPositionStyle(p.position);
          const name = (p.name || 'Sem Nome').trim();
          const initial = name.length > 0 ? name.charAt(0).toUpperCase() : '?';
          const isInactive = p.active === false;
          const stats = playerFullStats.get(p.id);

          if (activeTab === 'stats') {
            return (
              <div key={p.id} className={`bg-[#0A0A0A] rounded-[24px] border border-white/[0.08] overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2 ${isInactive ? 'opacity-50 grayscale' : 'shadow-lg'}`}>
                <div className="p-4 flex items-center justify-between border-b border-white/[0.03]">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-base border ${style.bg} ${style.text} border-white/5`}>
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{name}</h4>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{p.position}</p>
                      </div>
                   </div>
                   <div className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${stats.avgRating >= 8 ? 'bg-green-500/10 border-green-500/20 text-green-500' : stats.avgRating > 0 ? 'bg-[#F4BE02]/10 border-[#F4BE02]/20 text-[#F4BE02]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                      <Star size={10} fill={stats.avgRating > 0 ? "currentColor" : "none"} />
                      <span className="text-xs font-display font-bold">{stats.avgRating.toFixed(1)}</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-5 divide-x divide-white/[0.03] bg-white/[0.01]">
                   <StatItem active={sortBy === 'matches'} icon={<Activity size={10} />} value={stats.matches} label="Jogos" />
                   <StatItem active={sortBy === 'goals'} icon={<Trophy size={10} className="text-[#F4BE02]" />} value={stats.goals} label="Gols" color="text-[#F4BE02]" />
                   <StatItem active={sortBy === 'assists'} icon={<Zap size={10} className="text-blue-400" />} value={stats.assists} label="Assis" color="text-blue-400" />
                   <StatItem active={sortBy === 'yellow'} icon={<Square size={10} className="text-yellow-500" fill="currentColor" />} value={stats.yellow} label="CA" />
                   <StatItem active={sortBy === 'red'} icon={<Square size={10} className="text-red-600" fill="currentColor" />} value={stats.red} label="CV" />
                </div>
              </div>
            );
          }

          return (
            <div key={p.id} className={`bg-[#0A0A0A] p-4 rounded-3xl border transition-all flex items-center justify-between animate-in fade-in duration-300 ${isInactive ? 'border-white/5 opacity-50 grayscale' : 'border-white/[0.08] shadow-sm'}`}>
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg border transition-colors ${isInactive ? 'bg-white/5 text-white/20 border-white/5' : 'bg-white/[0.03] text-white/80 border-white/10'}`}>
                    {initial}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border border-black ${style.bg} ${style.text} flex items-center justify-center text-[9px] font-black`}>
                    {style.char}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{name}</h4>
                    {isInactive && <span className="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded bg-red-500/10 text-red-500">Inativo</span>}
                  </div>
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">{p.position}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {p.whatsapp && (
                  <button 
                    onClick={() => openWhatsApp(p.whatsapp!)}
                    className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
                <button 
                  onClick={() => onEditPlayer(p)}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <Users size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum atleta encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatChip = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
  >
    {label}
  </button>
);

const SortChip = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
  >
    {label}
  </button>
);

const StatItem = ({ icon, value, label, color = "text-white/80", active }: any) => (
  <div className={`flex flex-col items-center py-3 px-1 transition-colors ${active ? 'bg-white/[0.04]' : ''}`}>
    <div className="flex items-center gap-1 mb-1">
      {icon}
      <span className={`text-sm font-display font-bold ${color}`}>{value}</span>
    </div>
    <span className={`text-[7px] font-black uppercase tracking-widest ${active ? 'text-[#F4BE02]' : 'text-white/20'}`}>{label}</span>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30 hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

export default Players;
