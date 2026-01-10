
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { User, Check, X, Shield, Zap, Target, Loader2, MessageCircle, ToggleLeft, ToggleRight, Phone } from 'lucide-react';

interface Props {
  playerToEdit?: Player;
  onSave: (player: Player) => void;
  onCancel: () => void;
}

const PlayerForm: React.FC<Props> = ({ playerToEdit, onSave, onCancel }) => {
  const [name, setName] = useState(playerToEdit?.name || '');
  const [position, setPosition] = useState<Player['position']>(playerToEdit?.position || 'Atacante');
  const [whatsapp, setWhatsapp] = useState(playerToEdit?.whatsapp || '');
  const [isActive, setIsActive] = useState(playerToEdit?.active !== false);
  const [loading, setLoading] = useState(false);

  const isEditing = !!playerToEdit;

  const handleSave = () => {
    if (!name.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      const playerData: Player = {
        ...(playerToEdit || {
          id: Date.now().toString(),
          goals: 0,
          assists: 0,
          matchesPlayed: 0,
          yellowCards: 0,
          redCards: 0,
        }),
        name: name.trim(),
        position,
        whatsapp: whatsapp.trim(),
        active: isActive,
      };
      onSave(playerData);
      setLoading(false);
    }, 800);
  };

  const positions: { id: Player['position']; label: string; icon: any; color: string }[] = [
    { id: 'Atacante', label: 'Atacante', icon: <Target size={18} />, color: '#E70205' },
    { id: 'Meio-Campo', label: 'Meio-Campo', icon: <Zap size={18} />, color: '#F4BE02' },
    { id: 'Zagueiro', label: 'Zagueiro', icon: <Shield size={18} />, color: '#2563eb' },
    { id: 'Goleiro', label: 'Goleiro', icon: <User size={18} />, color: '#16a34a' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">{isEditing ? 'EDITAR' : 'NOVO'} ATLETA</h2>
          <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">{isEditing ? 'Atualizar Dados' : 'Inscrição Oficial'}</p>
        </div>
        <button 
          onClick={onCancel}
          className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Status Toggle (Só aparece na edição) */}
        {isEditing && (
          <div className="bg-[#111] p-5 rounded-[24px] border border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Status do Jogador</p>
              <h4 className="font-bold text-sm">{isActive ? 'Ativo no Elenco' : 'Inativo / Fora do Time'}</h4>
            </div>
            <button onClick={() => setIsActive(!isActive)} className="text-[#F4BE02]">
              {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-white/20" />}
            </button>
          </div>
        )}

        {/* Name Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Identificação</label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F4BE02] transition-colors">
              <User size={20} />
            </div>
            <input 
              autoFocus={!isEditing}
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-3xl p-5 pl-14 focus:border-[#F4BE02]/40 outline-none transition-all font-display text-lg font-bold placeholder:text-white/5"
              placeholder="Nome ou Apelido"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>

        {/* WhatsApp Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">WhatsApp (Contato)</label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-500 transition-colors">
              <Phone size={20} />
            </div>
            <input 
              type="tel"
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-3xl p-5 pl-14 focus:border-green-500/40 outline-none transition-all font-display text-lg font-bold placeholder:text-white/5"
              placeholder="(00) 00000-0000"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
            />
          </div>
        </div>

        {/* Position Grid */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Posição de Atuação</label>
          <div className="grid grid-cols-2 gap-3">
            {positions.map(pos => (
              <button
                key={pos.id}
                onClick={() => setPosition(pos.id)}
                className={`flex items-center gap-4 p-4 rounded-[22px] border transition-all duration-300
                  ${position === pos.id 
                    ? 'border-[#F4BE02] bg-[#F4BE02]/5 shadow-[0_8px_20px_rgba(244,190,2,0.1)]' 
                    : 'border-white/[0.06] bg-[#0A0A0A] opacity-40 hover:opacity-100 hover:border-white/10'}`}
              >
                <div 
                  className={`p-2 rounded-xl transition-colors ${position === pos.id ? 'bg-[#F4BE02] text-black' : 'bg-white/5 text-white'}`}
                >
                  {pos.icon}
                </div>
                <div className="text-left">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${position === pos.id ? 'text-[#F4BE02]' : 'text-white'}`}>
                    {pos.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className={`w-full bg-[#F4BE02] text-black font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(244,190,2,0.25)] disabled:opacity-40 disabled:scale-100
            `}
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Check size={24} strokeWidth={3} /> <span className="text-sm tracking-[0.1em]">{isEditing ? 'ATUALIZAR' : 'CADASTRAR'} ATLETA</span>
              </>
            )}
          </button>
          {!isEditing && (
            <p className="text-center text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-6">
              Ao confirmar, o atleta será adicionado ao elenco e <br/>ao controle de mensalidades automaticamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerForm;
