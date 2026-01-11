
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  FileText, 
  LayoutDashboard,
  CloudLightning,
  Loader2,
  WifiOff,
  RefreshCw,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { ScreenType, Player, Match, Payment, Expense, ScoringRule } from './types';
import Dashboard from './screens/Dashboard';
import Sumulas from './screens/Sumulas';
import Players from './screens/Players';
import Finance from './screens/Finance';
import PlayerForm from './screens/PlayerForm';
import Cartola from './screens/Cartola';
import { api } from './services/sheetApi';

const APP_VERSION = '1.0.1';

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const DEFAULT_RULES: ScoringRule[] = [
  { id: 'GOAL_GK', label: 'Gol de Goleiro', value: 10, active: true, type: 'positive', category: 'Goleiro' },
  { id: 'GOAL_DEF', label: 'Gol de Zagueiro', value: 8, active: true, type: 'positive', category: 'Zagueiro' },
  { id: 'GOAL_MID', label: 'Gol de Meio-Campo', value: 5, active: true, type: 'positive', category: 'Meio-Campo' },
  { id: 'GOAL_FWD', label: 'Gol de Atacante', value: 8, active: true, type: 'positive', category: 'Atacante' },
  { id: 'ASSIST', label: 'Assistência', value: 5, active: true, type: 'positive' },
  { id: 'CLEAN_SHEET', label: 'SG (Clean Sheet)', value: 5, active: true, type: 'positive' },
  { id: 'DEF_PENALTY', label: 'Defesa de Pênalti', value: 7, active: true, type: 'positive' },
  { id: 'COACH_WIN', label: 'Técnico: Vitória', value: 6, active: true, type: 'coach' },
  { id: 'COACH_DRAW', label: 'Técnico: Empate', value: 3, active: true, type: 'coach' },
  { id: 'FOUL', label: 'Falta Cometida', value: -0.5, active: true, type: 'negative' },
  { id: 'YELLOW', label: 'Cartão Amarelo', value: -2, active: true, type: 'negative' },
  { id: 'RED', label: 'Cartão Vermelho', value: -5, active: true, type: 'negative' },
  { id: 'MISSED_PENALTY', label: 'Pênalti Perdido', value: -4, active: true, type: 'negative' },
  { id: 'OWN_GOAL', label: 'Gol Contra', value: -5, active: true, type: 'negative' },
  { id: 'GOAL_CONCEDED', label: 'Gol Sofrido (GK)', value: -1, active: true, type: 'negative' },
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReadyToSync, setIsReadyToSync] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleForceRefresh = () => {
    sessionStorage.setItem('auto_refreshed', 'true');
    window.location.reload();
  };

  useEffect(() => {
    const init = async () => {
      if (!sessionStorage.getItem('auto_refreshed')) {
        handleForceRefresh();
        return;
      }

      setIsLoading(true);
      try {
        const data = await api.fetchAllData();
        if (data) {
          setPlayers(data.PLAYERS);
          setMatches(data.MATCHES);
          setPayments(data.PAYMENTS);
          setExpenses(data.EXPENSES);
          
          if (data.RULES && data.RULES.length > 0) {
            setScoringRules(data.RULES);
          } else {
            setScoringRules(DEFAULT_RULES);
          }
          
          setIsError(false);
          setIsLoading(false);
          setLastSyncTime(new Date());
          setTimeout(() => setIsReadyToSync(true), 1500);
        } else {
          setIsError(true);
          setIsLoading(false);
        }
      } catch (err) {
        setIsError(true);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isReadyToSync || isLoading) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      const success = await api.syncAllData({
        PLAYERS: players,
        MATCHES: matches,
        EXPENSES: expenses,
        PAYMENTS: payments,
        RULES: scoringRules
      });
      
      if (success) {
        setLastSyncTime(new Date());
      }
      setTimeout(() => setIsSyncing(false), 800);
    }, 1200);

    return () => clearTimeout(timer);
  }, [players, matches, expenses, payments, scoringRules, isReadyToSync, isLoading]);

  const savePlayer = (playerData: Player) => {
    if (editingPlayer) {
      setPlayers(prev => prev.map(p => p.id === playerData.id ? playerData : p));
    } else {
      setPlayers(prev => [...prev, playerData]);
      const now = new Date();
      const currentMonthName = MONTHS[now.getMonth()];
      const currentYear = now.getFullYear();
      
      setPayments(prev => [...prev, {
        playerId: playerData.id,
        month: `${currentMonthName} / ${currentYear}`,
        status: 'Pendente',
        value: 0 // Removido padrão de 50.00
      }]);
    }
    setEditingPlayer(null);
    setCurrentScreen('JOGADORES');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD': return <Dashboard players={players} matches={matches} />;
      case 'SUMULAS': return <Sumulas matches={matches} players={players} setMatches={setMatches} />;
      case 'JOGADORES': return <Players players={players} matches={matches} onAddPlayer={() => { setEditingPlayer(null); setCurrentScreen('CADASTRO_JOGADOR'); }} onEditPlayer={(p) => { setEditingPlayer(p); setCurrentScreen('EDITAR_JOGADOR'); }} />;
      case 'FINANCEIRO': return <Finance payments={payments} players={players} setPayments={setPayments} expenses={expenses} setExpenses={setExpenses} />;
      case 'CADASTRO_JOGADOR': return <PlayerForm onSave={savePlayer} onCancel={() => setCurrentScreen('JOGADORES')} />;
      case 'EDITAR_JOGADOR': return <PlayerForm playerToEdit={editingPlayer || undefined} onSave={savePlayer} onCancel={() => { setEditingPlayer(null); setCurrentScreen('JOGADORES'); }} />;
      case 'CARTOLA': return <Cartola players={players} matches={matches} rules={scoringRules} setRules={setScoringRules} />;
      default: return <Dashboard players={players} matches={matches} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-24 h-24 animate-bounce" />
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-[#F4BE02]">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-display font-bold text-sm uppercase tracking-widest">Iniciando Sistema...</span>
            </div>
            <p className="text-white/20 text-[9px] uppercase tracking-widest font-black">Sincronizando Banco de Dados</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <WifiOff size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Erro de Conexão</h2>
        <p className="text-white/40 text-sm mb-8">Não foi possível carregar as informações.</p>
        <button onClick={handleForceRefresh} className="bg-[#F4BE02] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-500/20">
          <RefreshCw size={18} /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32">
      <header className="sticky top-0 z-50 glass px-6 py-5 flex items-center justify-between border-b border-white/[0.03]">
        <div className="flex items-center gap-3">
          <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" alt="Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-display font-bold leading-none">100<span className="text-[#F4BE02]">FIRULA</span></h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-white/30">Management App</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleForceRefresh}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#F4BE02] hover:bg-[#F4BE02]/10 transition-all active:scale-90"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
            {isSyncing ? <Loader2 size={12} className="text-yellow-500 animate-spin" /> : <CheckCircle2 size={12} className="text-green-500" />}
            <div className="flex flex-col">
                <span className={`text-[8px] font-black uppercase ${isSyncing ? 'text-yellow-500' : 'text-green-500'}`}>
                {isSyncing ? 'Gravando...' : 'Conectado'}
                </span>
                {!isSyncing && lastSyncTime && (
                    <span className="text-[6px] text-white/30 uppercase font-bold tracking-tighter">
                        v. {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6">{renderScreen()}</main>

      <div className="w-full text-center py-6">
        <p className="text-[8px] font-black uppercase tracking-widest text-white/10 transition-colors hover:text-white/20">
          Desenvolvido por Aron Celso • v{APP_VERSION}
        </p>
      </div>

      <nav className="fixed bottom-6 left-5 right-5 z-50 bg-[#151515] rounded-[28px] border border-white/10 p-2 flex justify-between shadow-2xl backdrop-blur-xl">
        <NavBtn active={currentScreen === 'DASHBOARD'} onClick={() => setCurrentScreen('DASHBOARD')} icon={<LayoutDashboard size={20} />} label="Início" />
        <NavBtn active={currentScreen === 'SUMULAS'} onClick={() => setCurrentScreen('SUMULAS')} icon={<FileText size={20} />} label="Súmulas" />
        <NavBtn active={currentScreen === 'CARTOLA'} onClick={() => setCurrentScreen('CARTOLA')} icon={<Crown size={20} />} label="Cartola" />
        <NavBtn active={currentScreen === 'JOGADORES' || currentScreen === 'CADASTRO_JOGADOR' || currentScreen === 'EDITAR_JOGADOR'} onClick={() => setCurrentScreen('JOGADORES')} icon={<Users size={20} />} label="Elenco" />
        <NavBtn active={currentScreen === 'FINANCEIRO'} onClick={() => setCurrentScreen('FINANCEIRO')} icon={<DollarSign size={20} />} label="Caixa" />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 py-3 rounded-2xl transition-all duration-300 ${active ? 'text-[#F4BE02] bg-white/5' : 'text-white/30'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{label}</span>
  </button>
);

export default App;
