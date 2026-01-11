
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Payment, Expense } from '../types';
import { Wallet, TrendingUp, TrendingDown, Plus, Banknote, Calendar, Receipt, History, DollarSign, Layers, BarChart3, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, AlertCircle, CheckCircle2, RotateCcw, Lock, Users, UserMinus, UserCheck, Clock, Filter, ChevronDown, Search } from 'lucide-react';

interface Props {
  payments: Payment[];
  players: Player[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const ensureISO = (dateStr: any): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  
  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Se tiver barras DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  
  // Se tiver traços (ex: ISO timestamp)
  if (str.includes('-')) {
    const tSplit = str.split('T');
    const datePart = tSplit[0];
    const parts = datePart.split('-');
    
    // Se for YYYY-MM-DD
    if (parts.length === 3 && parts[0].length === 4) return datePart;
    
    // Se for DD-MM-YYYY (caso raro)
    if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  // Tentativa final com Date object
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
  }
  
  return '';
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parts = dateStr.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const Finance: React.FC<Props> = ({ payments, players, setPayments, expenses, setExpenses }) => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'history' | 'analysis'>('payments');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Estados para filtro de mensalidade
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // Estados para filtro de despesas (Saídas)
  const [expenseSearchMonth, setExpenseSearchMonth] = useState(MONTHS[now.getMonth()]);
  const [expenseSearchYear, setExpenseSearchYear] = useState(now.getFullYear().toString());

  // Estados para filtro de Análise
  const [analysisMonth, setAnalysisMonth] = useState(MONTHS[now.getMonth()]);
  const [analysisYear, setAnalysisYear] = useState(now.getFullYear().toString());

  // --- LÓGICA DE FILTROS DINÂMICOS ---
  // Calcula quais períodos (Mês/Ano) realmente possuem dados (Pagamentos Realizados ou Despesas)
  const validPeriods = useMemo(() => {
    const periods = new Set<string>();
    
    const addDate = (dateStr: string) => {
        const d = parseSafeDate(dateStr);
        if (!isNaN(d.getTime())) {
            periods.add(`${d.getFullYear()}-${d.getMonth()}`); // Formato: YYYY-IndexMês
        }
    };

    // Adiciona datas de pagamentos realizados
    payments.forEach(p => {
        if (p.status === 'Pago' && p.paymentDate) addDate(p.paymentDate);
    });

    // Adiciona datas de despesas
    expenses.forEach(e => {
        if (e.date) addDate(e.date);
    });

    // SEMPRE adiciona o mês/ano ATUAL para que o usuário possa operar o presente
    periods.add(`${now.getFullYear()}-${now.getMonth()}`);

    return Array.from(periods).map(p => {
        const [y, m] = p.split('-');
        return { year: y, monthIndex: parseInt(m) };
    });
  }, [payments, expenses]);

  // Deriva os Anos Disponíveis
  const availableYears = useMemo(() => {
    const years = new Set(validPeriods.map(p => p.year));
    return Array.from(years).sort().reverse();
  }, [validPeriods]);

  // --- LOGICA ESPECÍFICA PARA CADA ABA ---

  // 1. ABA PAGAMENTOS (MENSAL)
  const availablePaymentMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === selectedYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, selectedYear]);

  useEffect(() => {
    if (!availablePaymentMonths.includes(selectedMonth) && availablePaymentMonths.length > 0) {
        setSelectedMonth(availablePaymentMonths[availablePaymentMonths.length - 1]);
    }
  }, [selectedYear, availablePaymentMonths]);

  // 2. ABA SAÍDAS (DESPESAS)
  const availableExpenseMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === expenseSearchYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, expenseSearchYear]);

  useEffect(() => {
    if (!availableExpenseMonths.includes(expenseSearchMonth) && availableExpenseMonths.length > 0) {
        setExpenseSearchMonth(availableExpenseMonths[availableExpenseMonths.length - 1]);
    }
  }, [expenseSearchYear, availableExpenseMonths]);

  // 3. ABA ANÁLISE
  const availableAnalysisMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === analysisYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, analysisYear]);

  useEffect(() => {
    if (!availableAnalysisMonths.includes(analysisMonth) && availableAnalysisMonths.length > 0) {
        setAnalysisMonth(availableAnalysisMonths[availableAnalysisMonths.length - 1]);
    }
  }, [analysisYear, availableAnalysisMonths]);

  // -----------------------------------

  const currentPeriod = `${selectedMonth} / ${selectedYear}`;
  const analysisPeriod = `${analysisMonth} / ${analysisYear}`;

  const activePlayersList = useMemo(() => players.filter(p => p.active !== false), [players]);

  const { paidPlayers, unpaidPlayers } = useMemo(() => {
    const paid: { player: Player, payment?: Payment }[] = [];
    const unpaid: { player: Player, payment?: Payment }[] = [];

    // 1. LISTA DE PAGOS: Baseada na DATA DO PAGAMENTO (Regime de Caixa)
    // Mostra tudo que entrou no caixa no mês/ano selecionado, independente do mês de referência.
    const paidInPeriod = payments.filter(p => {
        if (p.status !== 'Pago') return false;
        
        // Verifica a Data do Pagamento
        const pDate = parseSafeDate(p.paymentDate || ''); 
        const pMonth = MONTHS[pDate.getMonth()];
        const pYear = pDate.getFullYear().toString();
        
        return pMonth === selectedMonth && pYear === selectedYear;
    });

    paidInPeriod.forEach(p => {
        const player = players.find(pl => pl.id === p.playerId);
        if (player) {
            paid.push({ player, payment: p });
        }
    });

    // 2. LISTA DE PENDENTES: Baseada no MÊS DE REFERÊNCIA (Regime de Competência)
    // Mostra quem ainda deve o mês selecionado no filtro.
    activePlayersList.forEach(player => {
        // Busca se existe registro para a referência selecionada
        const paymentRef = payments.find(p => p.playerId === player.id && p.month === currentPeriod);
        
        // Se não existir registro OU se existir e for Pendente, entra na lista de devedores do mês
        if (!paymentRef || paymentRef.status === 'Pendente') {
            unpaid.push({ player, payment: paymentRef });
        }
    });

    return { 
      paidPlayers: paid.sort((a, b) => (a.player.name || '').localeCompare(b.player.name || '')), 
      unpaidPlayers: unpaid.sort((a, b) => (a.player.name || '').localeCompare(b.player.name || '')) 
    };
  }, [activePlayersList, payments, currentPeriod, selectedMonth, selectedYear]);

  // Filtragem das despesas com base no filtro de busca
  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      const d = parseSafeDate(ex.date);
      const mMatch = MONTHS[d.getMonth()] === expenseSearchMonth;
      const yMatch = d.getFullYear().toString() === expenseSearchYear;
      return mMatch && yMatch;
    });
  }, [expenses, expenseSearchMonth, expenseSearchYear]);

  // Cálculos Gerais (Todo o histórico)
  const totalRevenueAllTime = useMemo(() => payments.filter(p => p.status === 'Pago').reduce((acc, p) => acc + (Number(p.value) || 0), 0), [payments]);
  const totalExpensesAllTime = useMemo(() => expenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0), [expenses]);
  const globalBalance = totalRevenueAllTime - totalExpensesAllTime;

  // Cálculos Filtrados para Análise
  const filteredRevenueAnalysis = useMemo(() => {
    return payments
      .filter(p => {
          if (p.status !== 'Pago') return false;
          const d = parseSafeDate(p.paymentDate || '');
          return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
      })
      .reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  }, [payments, analysisMonth, analysisYear]);

  const filteredExpensesAnalysis = useMemo(() => {
    return expenses
      .filter(ex => {
        const d = parseSafeDate(ex.date);
        const mMatch = MONTHS[d.getMonth()] === analysisMonth;
        const yMatch = d.getFullYear().toString() === analysisYear;
        return mMatch && yMatch;
      })
      .reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  }, [expenses, analysisMonth, analysisYear]);

  const filteredBalanceAnalysis = filteredRevenueAnalysis - filteredExpensesAnalysis;

  // ATUALIZADO: Agora aceita monthRef para saber exatamente qual registro alterar
  const togglePayment = (playerId: string, monthRef: string) => {
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      const todayIso = new Date().toISOString().split('T')[0];
      
      if (existingIdx !== -1) {
        const updated = [...prev];
        const newStatus = updated[existingIdx].status === 'Pago' ? 'Pendente' : 'Pago';
        updated[existingIdx] = { 
          ...updated[existingIdx], 
          status: newStatus as 'Pago' | 'Pendente', 
          paymentDate: newStatus === 'Pago' ? todayIso : ''
        };
        return updated;
      } else {
        return [...prev, { playerId, month: monthRef, status: 'Pago', value: 0, paymentDate: todayIso }];
      }
    });
  };

  const updatePaymentValue = (playerId: string, val: string, monthRef: string) => {
    const v = parseFloat(val) || 0;
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], value: v };
        return updated;
      } else {
        return [...prev, { playerId, month: monthRef, status: 'Pendente', value: v }];
      }
    });
  };

  const updatePaymentDate = (playerId: string, date: string, monthRef: string) => {
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], paymentDate: date };
        return updated;
      }
      return prev;
    });
  };

  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpenseType, setNewExpenseType] = useState<'Fixa' | 'Variável'>('Variável');

  const handleSaveExpense = () => {
    if (!newExpenseDesc || !newExpenseValue) return;
    const val = parseFloat(newExpenseValue) || 0;
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, description: newExpenseDesc.toUpperCase(), value: val, date: newExpenseDate, category: newExpenseType } : e));
    } else {
      setExpenses(prev => [{ id: Date.now().toString(), description: newExpenseDesc.toUpperCase(), value: val, date: newExpenseDate, category: newExpenseType }, ...prev]);
    }
    resetForm();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Deseja realmente excluir este lançamento de saída?')) {
      setExpenses(prev => prev.filter(e => String(e.id) !== String(id)));
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setNewExpenseDesc('');
    setNewExpenseValue('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
    setShowExpenseForm(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight uppercase">Caixa <span className="text-[#F4BE02]">100Firula</span></h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Gestão Financeira</p>
        </div>
        <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl border transition-all ${activeTab === 'history' ? 'bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/10 text-white/40'}`}>
          <History size={20} />
        </button>
      </div>

      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-3 gap-1">
        <TabBtn active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<Banknote size={14}/>} label="Mensal." />
        <TabBtn active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<Receipt size={14}/>} label="Saídas" />
        <TabBtn active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<BarChart3 size={14}/>} label="Análise" />
      </div>

      <div className="bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4BE02]/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Saldo Geral Acumulado</span>
          <h2 className={`text-5xl font-display font-bold ${globalBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
            <span className="text-lg text-[#F4BE02] mr-1">R$</span>{Math.abs(globalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-6 border-t border-white/5 text-center">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-green-500/60 mb-1">Receitas</p>
              <p className="font-bold text-lg text-white">R$ {totalRevenueAllTime.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-red-500/60 mb-1">Despesas</p>
              <p className="font-bold text-lg text-white">R$ {totalExpensesAllTime.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'payments' && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Filter size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtro de Visualização</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availablePaymentMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
            <div className="flex justify-center">
                <span className="text-[8px] font-bold text-[#F4BE02]/60 uppercase tracking-[0.3em]">Período: {currentPeriod}</span>
            </div>
          </div>

          <div className="space-y-10">
            {/* Payment Lists Logic */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <UserMinus size={16} className="text-red-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Pendentes ({unpaidPlayers.length})</h3>
                    <span className="text-[7px] font-black uppercase tracking-wider text-red-500/40">Ref: {currentPeriod}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {unpaidPlayers.length > 0 ? unpaidPlayers.map(({ player, payment }) => (
                  <div key={player.id} className="bg-[#0A0A0A] rounded-[24px] border border-white/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 transition-colors ${payment?.value ? 'bg-[#F4BE02]/10 text-[#F4BE02]' : 'bg-white/5 text-white/20'}`}>
                          {player.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm uppercase text-white/90 truncate max-w-[120px]">{player.name}</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{player.position}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePayment(player.id, payment?.month || currentPeriod)} 
                        className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/10 active:scale-95 transition-all"
                      >
                        MARCAR PAGO
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <DollarSign size={14} className="text-white/20" />
                        <input 
                            type="number" 
                            placeholder="VALOR R$" 
                            value={payment?.value || ''} 
                            onChange={e => updatePaymentValue(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 text-right font-display font-bold text-sm text-[#F4BE02] outline-none placeholder:text-white/5" 
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/10">
                     <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={24} className="text-green-500" /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sem pendências (Ref: {currentPeriod})</p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-white/5 mx-2"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck size={16} className="text-green-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Recebidos ({paidPlayers.length})</h3>
                    <span className="text-[7px] font-black uppercase tracking-wider text-green-500/40">Data Pag: {currentPeriod}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {paidPlayers.length > 0 ? paidPlayers.map(({ player, payment }) => (
                  <div key={`${player.id}-${payment?.month}`} className="bg-green-500/[0.02] rounded-[24px] border border-green-500/20 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500 text-black flex items-center justify-center font-bold text-lg"><CheckCircle2 size={22} strokeWidth={3} /></div>
                        <div>
                          <h4 className="font-bold text-sm uppercase text-white/90 truncate max-w-[120px]">{player.name}</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest text-green-500/60">REF: {payment?.month}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePayment(player.id, payment?.month || currentPeriod)} 
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all flex items-center justify-center active:scale-90"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-green-500/10 p-2.5 rounded-xl border border-green-500/10">
                        <DollarSign size={14} className="text-green-500/40" />
                        <input 
                            type="number" 
                            placeholder="VALOR" 
                            value={payment?.value || ''} 
                            onChange={e => updatePaymentValue(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 font-display font-bold text-sm text-green-500 outline-none placeholder:text-green-500/20" 
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <Clock size={14} className="text-white/20" />
                        <input 
                            type="date" 
                            value={ensureISO(payment?.paymentDate)} 
                            onChange={e => updatePaymentDate(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 text-[10px] font-bold text-white/80 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-10 text-[9px] font-black uppercase tracking-widest">Nenhum pagamento recebido em {currentPeriod}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'expenses' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {!showExpenseForm ? (
            <button onClick={() => setShowExpenseForm(true)} className="w-full bg-white/[0.03] border border-dashed border-white/20 hover:border-[#F4BE02] text-white/40 p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all">
              <Plus size={16}/> <span className="text-xs font-black uppercase tracking-widest">Nova Saída</span>
            </button>
          ) : (
            <div className="bg-[#0A0A0A] p-5 rounded-[24px] border border-white/10 space-y-4">
               <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm uppercase">{editingExpense ? 'Editar Saída' : 'Nova Despesa'}</h4>
                  <button onClick={resetForm} className="text-[9px] font-black text-white/20 uppercase tracking-widest">Fechar</button>
               </div>
               <div className="space-y-4">
                  <input type="text" placeholder="DESCRIÇÃO" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-[#F4BE02]/50" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value.toUpperCase())} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="VALOR" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold outline-none" value={newExpenseValue} onChange={e => setNewExpenseValue(e.target.value)} />
                    <input type="date" className="bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none" value={newExpenseDate} onChange={e => setNewExpenseDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setNewExpenseType('Fixa')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${newExpenseType === 'Fixa' ? 'bg-[#F4BE02] text-black border-[#F4BE02]' : 'bg-white/5 text-white/30 border-white/5'}`}>Fixa</button>
                    <button onClick={() => setNewExpenseType('Variável')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${newExpenseType === 'Variável' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/30 border-white/5'}`}>Variável</button>
                  </div>
                  <button onClick={handleSaveExpense} className="w-full bg-red-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Salvar Saída</button>
               </div>
            </div>
          )}

          {/* FILTRO DE PESQUISA NAS SAÍDAS */}
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3 mt-4">
            <div className="flex items-center gap-2 px-1">
                <Search size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Pesquisar Saídas</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={expenseSearchMonth} 
                        onChange={e => setExpenseSearchMonth(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableExpenseMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={expenseSearchYear} 
                        onChange={e => setExpenseSearchYear(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredExpenses.length > 0 ? filteredExpenses.map(ex => (
              <div key={ex.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${ex.category === 'Fixa' ? 'bg-[#F4BE02]/10 border-[#F4BE02]/20 text-[#F4BE02]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <TrendingDown size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase truncate max-w-[140px] text-white/90">{ex.description}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{parseSafeDate(ex.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-red-500">R$ {ex.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingExpense(ex); setNewExpenseDesc(ex.description); setNewExpenseValue(ex.value.toString()); setNewExpenseDate(ensureISO(ex.date)); setNewExpenseType(ex.category as any); setShowExpenseForm(true); }} 
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                      <Pencil size={12}/>
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(ex.id)} 
                      className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all active:scale-90"
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-20 flex flex-col items-center">
                 <Receipt size={40} className="mb-2" />
                 <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma saída encontrada para este filtro</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'analysis' && (
        <section className="space-y-6 animate-in fade-in slide-in-from-right-4">
          
          {/* FILTRO DE PESQUISA (ANÁLISE) */}
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Search size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtrar Análise</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={analysisMonth} 
                        onChange={e => setAnalysisMonth(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableAnalysisMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={analysisYear} 
                        onChange={e => setAnalysisYear(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
          </div>

          {/* RESULTADO FILTRADO */}
          <div className="bg-[#111] border border-white/10 rounded-[32px] p-6 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-display font-bold uppercase tracking-tight">Resultado: {analysisMonth}</h3>
                <div className={`p-2 rounded-xl ${filteredBalanceAnalysis >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}><PieChart size={20}/></div>
             </div>
             <div className="grid grid-cols-1 gap-2">
                <SummaryItem icon={<ArrowUpCircle size={18} className="text-green-500"/>} label="Receitas (Filtro)" value={filteredRevenueAnalysis} color="text-green-500" />
                <SummaryItem icon={<ArrowDownCircle size={18} className="text-red-500"/>} label="Saídas (Filtro)" value={filteredExpensesAnalysis} color="text-red-500" />
                <div className="h-[1px] bg-white/5 my-1"></div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Saldo (Filtro)</span>
                   <span className={`text-xl font-display font-bold ${filteredBalanceAnalysis >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {Math.abs(filteredBalanceAnalysis).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>

          {/* RESULTADO GERAL (Mantido como secundário) */}
           <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 space-y-4 opacity-50 hover:opacity-100 transition-opacity">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-display font-bold uppercase tracking-tight text-white/60">Acumulado Geral</h3>
             </div>
             <div className="grid grid-cols-1 gap-2">
                <SummaryItem icon={<ArrowUpCircle size={18} className="text-white/20"/>} label="Total Recebido" value={totalRevenueAllTime} color="text-white/40" />
                <SummaryItem icon={<ArrowDownCircle size={18} className="text-white/20"/>} label="Total Gasto" value={totalExpensesAllTime} color="text-white/40" />
                <div className="h-[1px] bg-white/5 my-1"></div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Saldo Atual</span>
                   <span className={`text-xl font-display font-bold ${globalBalance >= 0 ? 'text-white/50' : 'text-red-500/50'}`}>R$ {Math.abs(globalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="px-1 flex justify-between items-center">
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Histórico de Movimentações</h3>
             <button onClick={() => setActiveTab('payments')} className="text-[#F4BE02] text-[10px] font-black uppercase tracking-widest">Voltar</button>
          </div>
          <div className="space-y-2">
            {[...payments.filter(p => p.status === 'Pago').map(p => ({ ...p, type: 'IN' as const, dateLabel: p.paymentDate || 'SEM DATA', desc: players.find(pl => pl.id === p.playerId)?.name || 'ATLETA' })), 
              ...expenses.map(e => ({ ...e, type: 'OUT' as const, dateLabel: e.date, desc: e.description }))
            ].sort((a, b) => b.dateLabel.localeCompare(a.dateLabel)).map((item, i) => (
              <div key={i} className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'IN' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {item.type === 'IN' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  </div>
                  <div>
                    <h5 className="font-bold text-[10px] uppercase truncate max-w-[150px] text-white/90">{item.desc}</h5>
                    <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">{item.dateLabel}</span>
                  </div>
                </div>
                <span className={`font-display font-bold text-sm ${item.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>R$ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#F4BE02] text-black' : 'text-white/30 hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const SummaryItem = ({ icon, label, value, color }: any) => (
  <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
    </div>
    <span className={`font-display font-bold text-lg ${color}`}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
  </div>
);

export default Finance;
