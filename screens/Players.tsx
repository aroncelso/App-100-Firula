
import React, { useState, useMemo } from 'react';
import { Player, Match } from '../types';
import { Target, Shield, Zap, Search, UserPlus, Users, Crown, Star, Square, ShieldAlert, Swords, Calendar, Check, Layers, User } from 'lucide-react';

interface Props {
  players: Player[];
  matches: Match[];
  onAddPlayer: () => void;
}

const Players: React.FC<Props> = ({ players, matches, onAddPlayer }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        // Only show players with a valid name
        return nameMatch && (p.name && p.name.trim().length > 0);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [players, searchTerm]);

  const getPositionStyle = (pos: string) => {
    switch (pos) {
      case 'Atacante': return { bg: 'bg-red-500/10', text: 'text-red-500', char: 'A' };
      case 'Meio-Campo': return { bg: 'bg-[#F4BE02]/10', text: 'text-[#F4BE02]', char: 'M' };
      case 'Zagueiro': return { bg: 'bg-blue-500/10', text: 'text-blue-500', char: 'Z' };
      case 'Goleiro': return { bg: 'bg-green-500/10', text: 'text-green-500', char: 'G' };
      default: return { bg: 'bg-white/10', text: 'text-white', char: '?' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">ELENCO</h2>
          <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">{players.length} Atletas Inscritos</p>
        </div>
      </div>

      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-2 gap-2">
        <TabBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<Users size={14}/>} label="Lista" />
        <TabBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Target size={14}/>} label="Status" />
      </div>

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

          return (
            <div key={p.id} className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-display font-bold text-lg text-white/80">
                    {initial}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border border-black ${style.bg} ${style.text} flex items-center justify-center text-[9px] font-black`}>
                    {style.char}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{name}</h4>
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">{p.position}</p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors">
                <User size={16} />
              </button>
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

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#F4BE02] text-black shadow-lg' : 'text-white/30 hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

export default Players;
