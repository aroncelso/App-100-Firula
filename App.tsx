
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  FileText, 
  LayoutDashboard,
  Bell,
  CloudLightning,
  Loader2,
  WifiOff,
  RefreshCw,
  Crown
} from 'lucide-react';
import { ScreenType, Player, Match, Payment, Expense } from './types';
import Dashboard from './screens/Dashboard';
import Sumulas from './screens/Sumulas';
import Players from './screens/Players';
import Finance from './screens/Finance';
import PlayerForm from './screens/PlayerForm';
import Cartola from './screens/Cartola';
import { api } from './services/sheetApi';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Prevention flags
  const dataLoaded = useRef(false);
  const skipNextSync = useRef<{ [key: string]: boolean }>({
    PLAYERS: true,
    MATCHES: true,
    PAYMENTS: true,
    EXPENSES: true
  });

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await api.fetchAllData();
      if (data) {
        // Filter out empty rows that might come from the spreadsheet
        const cleanPlayers = (data.PLAYERS || []).filter((p: any) => p.id && p.name);
        
        setPlayers(cleanPlayers);
        setMatches(data.MATCHES || []);
        setPayments(data.PAYMENTS || []);
        setExpenses(data.EXPENSES || []);
        
        // Mark as loaded and prevent immediate sync back
        dataLoaded.current = true;
        setIsError(false);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Sync Logic
  const sync = async (type: string, data: any[]) => {
    if (!dataLoaded.current) return;
    
    // If this is the first change after load, skip it to avoid "echo" sync
    if (skipNextSync.current[type]) {
      skipNextSync.current[type] = false;
      return;
    }

    setIsSyncing(true);
    await api.syncData(type as any, data);
    // Tiny delay to show the "Saving" indicator to user
    setTimeout(() => setIsSyncing(false), 1000);
  };

  useEffect(() => { sync('PLAYERS', players); }, [players]);
  useEffect(() => { sync('MATCHES', matches); }, [matches]);
  useEffect(() => { sync('PAYMENTS', payments); }, [payments]);
  useEffect(() => { sync('EXPENSES', expenses); }, [expenses]);

  const addPlayer = (newPlayer: Player) => {
    setPlayers(prev => [...prev, newPlayer]);
    setPayments(prev => [...prev, {
      playerId: newPlayer.id,
      month: new Date().toLocaleString('pt-BR', { month: 'long' }),
      status: 'Pendente',
      value: 50.00
    }]);
    setCurrentScreen('JOGADORES');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD': return <Dashboard players={players} matches={matches} />;
      case 'SUMULAS': return <Sumulas matches={matches} players={players} setMatches={setMatches} />;
      case 'JOGADORES': return <Players players={players} matches={matches} onAddPlayer={() => setCurrentScreen('CADASTRO_JOGADOR')} />;
      case 'FINANCEIRO': return <Finance payments={payments} players={players} setPayments={setPayments} expenses={expenses} setExpenses={setExpenses} />;
      case 'CADASTRO_JOGADOR': return <PlayerForm onSave={addPlayer} onCancel={() => setCurrentScreen('JOGADORES')} />;
      case 'CARTOLA': return <Cartola players={players} matches={matches} />;
      default: return <Dashboard players={players} matches={matches} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <img src="https://i.postimg.cc/tR3cPQZd/100-firula-II-removebg-preview.png" className="w-24 h-24 animate-bounce" />
        <div className="flex items-center gap-3 text-[#F4BE02]">
          <Loader2 className="animate-spin" size={20} />
          <span className="font-display font-bold text-sm uppercase tracking-widest">Sincronizando Elenco...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <WifiOff size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Erro de Conexão</h2>
        <p className="text-white/40 text-sm mb-8">Não foi possível carregar os dados. Verifique sua planilha e o script.</p>
        <button onClick={() => window.location.reload()} className="bg-[#F4BE02] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2">
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
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isSyncing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
            <CloudLightning size={12} className={isSyncing ? 'text-yellow-500 animate-pulse' : 'text-green-500'} />
            <span className={`text-[9px] font-black uppercase ${isSyncing ? 'text-yellow-500' : 'text-green-500'}`}>
              {isSyncing ? 'Salvando...' : 'Cloud OK'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6">{renderScreen()}</main>

      <nav className="fixed bottom-6 left-5 right-5 z-50 bg-[#151515] rounded-[28px] border border-white/10 p-2 flex justify-between shadow-2xl backdrop-blur-xl">
        <NavBtn active={currentScreen === 'DASHBOARD'} onClick={() => setCurrentScreen('DASHBOARD')} icon={<LayoutDashboard size={20} />} label="Início" />
        <NavBtn active={currentScreen === 'SUMULAS'} onClick={() => setCurrentScreen('SUMULAS')} icon={<FileText size={20} />} label="Súmulas" />
        <NavBtn active={currentScreen === 'CARTOLA'} onClick={() => setCurrentScreen('CARTOLA')} icon={<Crown size={20} />} label="Ranking" />
        <NavBtn active={currentScreen === 'JOGADORES' || currentScreen === 'CADASTRO_JOGADOR'} onClick={() => setCurrentScreen('JOGADORES')} icon={<Users size={20} />} label="Elenco" />
        <NavBtn active={currentScreen === 'FINANCEIRO'} onClick={() => setCurrentScreen('FINANCEIRO')} icon={<DollarSign size={20} />} label="Caixa" />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 py-3 rounded-2xl transition-all ${active ? 'text-[#F4BE02] bg-white/5' : 'text-white/30'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{label}</span>
  </button>
);

export default App;
