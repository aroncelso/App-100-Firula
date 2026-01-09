import React, { useState, useEffect } from 'react';
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
import { ScreenType, Player, Match, Payment, QuadroStats, HalfStats, Expense } from './types';
import Dashboard from './screens/Dashboard';
import Sumulas from './screens/Sumulas';
import Players from './screens/Players';
import Finance from './screens/Finance';
import PlayerForm from './screens/PlayerForm';
import Cartola from './screens/Cartola';
import { api } from './services/sheetApi';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  
  // Start with empty arrays - data will come from Google Sheets
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Controls when auto-sync can start

  // --- Initial Fetch ---
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        setFetchError(false);
        const data = await api.fetchAllData();
        
        if (data) {
            if (data.PLAYERS) setPlayers(data.PLAYERS);
            if (data.MATCHES) setMatches(data.MATCHES);
            if (data.EXPENSES) setExpenses(data.EXPENSES);
            if (data.PAYMENTS) setPayments(data.PAYMENTS);
            
            // Allow sync only after data is successfully loaded
            // This prevents overwriting the cloud database with empty local state on error
            setTimeout(() => setIsDataLoaded(true), 1000); 
        } else {
            setFetchError(true);
        }
        
        setIsLoading(false);
    };
    loadData();
  }, []);

  const addPlayer = (newPlayer: Player) => {
    setPlayers(prev => [...prev, newPlayer]);
    setPayments(prev => [...prev, {
      playerId: newPlayer.id,
      month: 'Novembro', // You might want to make this dynamic
      status: 'Pendente',
      value: 50.00
    }]);
    setCurrentScreen('JOGADORES');
  };

  // --- Auto Sync Effects ---
  // Only run sync if data has been successfully loaded first (SAFETY CHECK)
  
  useEffect(() => {
    if (!isDataLoaded) return;
    const timeout = setTimeout(() => {
        api.syncPlayers(players);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [players, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const timeout = setTimeout(() => {
        api.syncMatches(matches);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [matches, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const timeout = setTimeout(() => {
        api.syncPayments(payments);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [payments, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const timeout = setTimeout(() => {
        api.syncExpenses(expenses);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [expenses, isDataLoaded]);


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
          <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
              <div className="relative">
                 <div className="absolute inset-0 bg-[#F4BE02] blur-[20px] opacity-20 rounded-full animate-pulse"></div>
                 <img src="https://i.postimg.cc/JhsJShYM/100_firula_II.jpg" className="w-20 h-20 rounded-full border border-[#F4BE02]/30 relative z-10 animate-bounce" />
              </div>
              <div className="flex items-center gap-2 text-[#F4BE02]">
                  <Loader2 className="animate-spin" />
                  <span className="font-black uppercase tracking-widest text-xs">Sincronizando Dados...</span>
              </div>
          </div>
      )
  }

  if (fetchError) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 text-white p-8 text-center animate-in fade-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <WifiOff size={32} className="text-red-500" />
            </div>
            <div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Erro de Conexão</h2>
                <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
                    Não foi possível carregar os dados da planilha.
                </p>
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-white/40 text-left">
                    <p className="font-bold text-white/60 mb-1">Soluções possíveis:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Verifique sua conexão com a internet.</li>
                        <li>Confirme se o Script Google está implantado como <strong>"Qualquer pessoa" (Anyone)</strong>.</li>
                    </ul>
                </div>
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2 px-8 py-4 bg-[#F4BE02] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#F4BE02]/20"
            >
                <RefreshCw size={16} /> Tentar Novamente
            </button>
        </div>
    )
}

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
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${isDataLoaded ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                <CloudLightning size={10} className={isDataLoaded ? "text-green-500" : "text-yellow-500"} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${isDataLoaded ? "text-green-500/60" : "text-yellow-500/60"}`}>
                    {isDataLoaded ? 'Sync On' : 'Offline'}
                </span>
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
          icon={<LayoutDashboard size={20} />}
          label="Início"
        />
        <NavButton 
          active={currentScreen === 'SUMULAS'} 
          onClick={() => setCurrentScreen('SUMULAS')}
          icon={<FileText size={20} />}
          label="Súmulas"
        />
        <NavButton 
          active={currentScreen === 'CARTOLA'} 
          onClick={() => setCurrentScreen('CARTOLA')}
          icon={<Crown size={20} />}
          label="Cartola"
        />
        <NavButton 
          active={currentScreen === 'JOGADORES' || currentScreen === 'CADASTRO_JOGADOR'} 
          onClick={() => setCurrentScreen('JOGADORES')}
          icon={<Users size={20} />}
          label="Elenco"
        />
        <NavButton 
          active={currentScreen === 'FINANCEIRO'} 
          onClick={() => setCurrentScreen('FINANCEIRO')}
          icon={<DollarSign size={20} />}
          label="Caixa"
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
    <span className={`text-[8px] font-bold uppercase tracking-wider mt-1 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 w-5 h-[2px] bg-[#F4BE02] rounded-full shadow-[0_0_8px_#F4BE02]"></div>
    )}
  </button>
);

export default App;