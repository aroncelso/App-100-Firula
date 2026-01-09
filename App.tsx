
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  FileText, 
  LayoutDashboard,
  Bell,
  CloudLightning
} from 'lucide-react';
import { ScreenType, Player, Match, Payment, QuadroStats, HalfStats, Expense } from './types';
import Dashboard from './screens/Dashboard';
import Sumulas from './screens/Sumulas';
import Players from './screens/Players';
import Finance from './screens/Finance';
import PlayerForm from './screens/PlayerForm';
import { api } from './services/sheetApi';

const createEmptyHalf = (): HalfStats => ({ fouls: 0, opponentGoals: 0, opponentFouls: 0, events: [] });
const createEmptyQuadro = (): QuadroStats => ({ 
  tempo1: createEmptyHalf(), 
  tempo2: createEmptyHalf() 
});

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Zezinho', position: 'Atacante', goals: 12, assists: 5, matchesPlayed: 8, yellowCards: 2, redCards: 0 },
  { id: '2', name: 'Ricardinho', position: 'Meio-Campo', goals: 4, assists: 15, matchesPlayed: 8, yellowCards: 1, redCards: 0 },
  { id: '3', name: 'Tão', position: 'Zagueiro', goals: 1, assists: 2, matchesPlayed: 7, yellowCards: 4, redCards: 1 },
  { id: '4', name: 'Giba', position: 'Goleiro', goals: 0, assists: 1, matchesPlayed: 8, yellowCards: 0, redCards: 0 },
];

const INITIAL_MATCHES: Match[] = [
  { 
    id: 'm1', 
    date: '2023-10-20', 
    opponent: 'Amigos do Copo', 
    label: 'Quadro 2',
    notes: 'Jogo corrido, calor forte.',
    stats: {
      tempo1: { fouls: 3, opponentGoals: 0, opponentFouls: 0, events: [{ id: 'e1', playerId: '1', type: 'GOL' }] },
      tempo2: { fouls: 5, opponentGoals: 2, opponentFouls: 0, events: [{ id: 'e2', playerId: '2', type: 'GOL' }] }
    }
  },
  { 
    id: 'm2', 
    date: '2023-10-20', 
    opponent: 'Amigos do Copo', 
    label: 'Quadro 1',
    notes: 'Vitória apertada.',
    stats: {
      tempo1: { fouls: 2, opponentGoals: 1, opponentFouls: 0, events: [{ id: 'e3', playerId: '1', type: 'GOL' }] },
      tempo2: { fouls: 1, opponentGoals: 0, opponentFouls: 0, events: [] }
    }
  },
];

const INITIAL_PAYMENTS: Payment[] = INITIAL_PLAYERS.map(p => ({
  playerId: p.id,
  month: 'Novembro',
  status: Math.random() > 0.3 ? 'Pago' : 'Pendente',
  value: 50.00
}));

const INITIAL_EXPENSES: Expense[] = [
  { id: 'ex1', description: 'Aluguel do Campo', value: 250.00, date: '2023-11-01', category: 'Campo' },
  { id: 'ex2', description: 'Água e Gelo', value: 35.00, date: '2023-11-01', category: 'Insumos' }
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [isSyncing, setIsSyncing] = useState(false);

  const addPlayer = (newPlayer: Player) => {
    setPlayers(prev => [...prev, newPlayer]);
    setPayments(prev => [...prev, {
      playerId: newPlayer.id,
      month: 'Novembro',
      status: 'Pendente',
      value: 50.00
    }]);
    setCurrentScreen('JOGADORES');
  };

  // --- Auto Sync Effects ---
  // Debounce logic is ideal here, but for simplicity we sync on change.
  // The 'no-cors' mode means we don't get a response, so we just fire and forget.
  
  useEffect(() => {
    const timeout = setTimeout(() => {
        api.syncPlayers(players);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [players]);

  useEffect(() => {
    const timeout = setTimeout(() => {
        api.syncMatches(matches);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [matches]);

  useEffect(() => {
    const timeout = setTimeout(() => {
        api.syncPayments(payments);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [payments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
        api.syncExpenses(expenses);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [expenses]);


  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD': return <Dashboard players={players} matches={matches} />;
      case 'SUMULAS': return <Sumulas matches={matches} players={players} setMatches={setMatches} />;
      case 'JOGADORES': return <Players players={players} matches={matches} onAddPlayer={() => setCurrentScreen('CADASTRO_JOGADOR')} />;
      case 'FINANCEIRO': return <Finance payments={payments} players={players} setPayments={setPayments} expenses={expenses} setExpenses={setExpenses} />;
      case 'CADASTRO_JOGADOR': return <PlayerForm onSave={addPlayer} onCancel={() => setCurrentScreen('JOGADORES')} />;
      default: return <Dashboard players={players} matches={matches} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32">
      <header className="sticky top-0 z-50 glass px-6 py-5 flex items-center justify-between border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#F4BE02] blur-[8px] opacity-20 rounded-full animate-pulse"></div>
            <img 
              src="https://i.postimg.cc/JhsJShYM/100_firula_II.jpg" 
              alt="100 Firula Logo" 
              className="w-10 h-10 rounded-full border border-[#F4BE02]/40 relative z-10"
            />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold leading-none tracking-tight">
              100<span className="text-[#F4BE02]">FIRULA</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mt-1">Management App</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-full border border-white/5">
                <CloudLightning size={10} className="text-green-500" />
                <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Sync On</span>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <Bell size={18} />
            </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 animate-in fade-in duration-500">
        {renderScreen()}
      </main>

      <nav className="fixed bottom-6 left-5 right-5 z-50 glass rounded-3xl border border-white/[0.08] px-2 py-2 flex justify-between items-center safe-bottom gold-glow shadow-2xl">
        <NavButton 
          active={currentScreen === 'DASHBOARD'} 
          onClick={() => setCurrentScreen('DASHBOARD')}
          icon={<LayoutDashboard size={22} />}
          label="Início"
        />
        <NavButton 
          active={currentScreen === 'SUMULAS'} 
          onClick={() => setCurrentScreen('SUMULAS')}
          icon={<FileText size={22} />}
          label="Súmulas"
        />
        <NavButton 
          active={currentScreen === 'JOGADORES' || currentScreen === 'CADASTRO_JOGADOR'} 
          onClick={() => setCurrentScreen('JOGADORES')}
          icon={<Users size={22} />}
          label="Elenco"
        />
        <NavButton 
          active={currentScreen === 'FINANCEIRO'} 
          onClick={() => setCurrentScreen('FINANCEIRO')}
          icon={<DollarSign size={22} />}
          label="Financeiro"
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${active ? 'text-[#F4BE02]' : 'text-white/40'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 w-5 h-[2px] bg-[#F4BE02] rounded-full shadow-[0_0_8px_#F4BE02]"></div>
    )}
  </button>
);

export default App;
