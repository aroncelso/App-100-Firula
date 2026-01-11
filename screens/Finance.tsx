
import React, { useState, useMemo } from 'react';
import { Player, Payment, Expense } from '../types';
import { Wallet, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Plus, Banknote, Calendar, Receipt, History, ChevronLeft, ChevronRight, Edit2, DollarSign, Tag, Layers, BarChart3, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil } from 'lucide-react';

interface Props {
  payments: Payment[];
  players: Player[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const Finance: React.FC<Props> = ({ payments, players, setPayments, expenses, setExpenses }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'history' | 'analysis'>('payments');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Period Selection
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(months[currentMonthIdx]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  
  const selectedPeriod = `${selectedMonth} / ${selectedYear}`;

  // Helper to normalize strings for comparison
  const normalizePeriod = (p: string) => p.trim().toUpperCase();

  // Expense Form State
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpenseType, setNewExpenseType] = useState<'Fixa' | 'Variável'>('Variável');

  // Global Totals (Current Balance)
  const totalRevenue = useMemo(() => 
    payments
      .filter(p => p.status === 'Pago')
      .reduce((acc, p) => acc + (Number(p.value) || 0), 0)
  , [payments]);

  const totalExpenses = useMemo(() => 
    expenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0)
  , [expenses]);

  const globalBalance = totalRevenue - totalExpenses;
  
  // Period Specific Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date + 'T00:00:00'); 
      const m = months[d.getMonth()];
      const y = d.getFullYear().toString();
      const expensePeriod = normalizePeriod(`${m} / ${y}`);
      return expensePeriod === normalizePeriod(selectedPeriod);
    });
  }, [expenses, selectedMonth, selectedYear, selectedPeriod]);

  const periodRevenueItems = useMemo(() => {
    return payments.filter(p => normalizePeriod(p.month) === normalizePeriod(selectedPeriod) && p.status === 'Pago');
  }, [payments, selectedPeriod]);

  const periodRevenueTotal = useMemo(() => {
    return periodRevenueItems.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  }, [periodRevenueItems]);

  const periodExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  }, [filteredExpenses]);

  const periodBalance = periodRevenueTotal - periodExpensesTotal;

  // Progress in period
  const periodPayments = useMemo(() => 
    payments.filter(p => normalizePeriod(p.month) === normalizePeriod(selectedPeriod))
  , [payments, selectedPeriod]);

  const paidInPeriodCount = periodPayments.filter(p => p.status === 'Pago').length;
  const activePlayers = players.filter(p => p.active !== false);
  const progress = activePlayers.length > 0 ? (paidInPeriodCount / activePlayers.length) * 100 : 0;

  const togglePayment = (playerId: string) => {
    setPayments(prev => {
      const existing = prev.find(p => p.playerId === playerId && normalizePeriod(p.month) === normalizePeriod(selectedPeriod));
      if (existing) {
        return prev.map(p => (p.playerId === playerId && normalizePeriod(p.month) === normalizePeriod(selectedPeriod)) 
          ? { ...p, status: p.status === 'Pago' ? 'Pendente' : 'Pago' } 
          : p
        );
      } else {
        return [...prev, { playerId, month: selectedPeriod, status: 'Pago', value: 50.00 }];
      }
    });
  };

  const updatePaymentValue = (playerId: string, newValue: string) => {
    const val = parseFloat(newValue) || 0;
    setPayments(prev => {
      const existing = prev.find(p => p.playerId === playerId && normalizePeriod(p.month) === normalizePeriod(selectedPeriod));
      if (existing) {
        return prev.map(p => (p.playerId === playerId && normalizePeriod(p.month) === normalizePeriod(selectedPeriod)) ? { ...p, value: val } : p);
      } else {
        return [...prev, { playerId, month: selectedPeriod, status: 'Pendente', value: val }];
      }
    });
  };

  const resetExpenseForm = () => {
    setNewExpenseDesc('');
    setNewExpenseValue('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
    setNewExpenseType('Variável');
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const handleSaveExpense = () => {
    if (!newExpenseDesc || !newExpenseValue) return;

    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? {
        ...e,
        description: newExpenseDesc.toUpperCase(),
        value: parseFloat(newExpenseValue),
        date: newExpenseDate,
        category: newExpenseType
      } : e));
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        description: newExpenseDesc.toUpperCase(),
        value: parseFloat(newExpenseValue),
        date: newExpenseDate,
        category: newExpenseType
      };
      setExpenses(prev => [expense, ...prev]);
    }
    
    resetExpenseForm();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpenseDesc(expense.description);
    setNewExpenseValue(expense.value.toString());
    setNewExpenseDate(expense.date);
    setNewExpenseType(expense.category as 'Fixa' | 'Variável');
    setShowExpenseForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento de saída?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const updateExpenseValue = (id: string, newValue: string) => {
    const val = parseFloat(newValue) || 0;
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, value: val } : e));
  };

  // Improved History Logic with proper date sorting
  const historyItems = useMemo(() => {
    const pItems = payments
      .filter(p => p.status === 'Pago')
      .map(p => {
        const player = players.find(pl => pl.id === p.playerId);
        // Create a sortable date from "Month / Year"
        const [mName, yStr] = p.month.split(' / ');
        const mIdx = months.indexOf(mName);
        const sortDate = new Date(parseInt(yStr), mIdx, 1).getTime();

        return {
          id: `${p.playerId}-${p.month}-${Math.random()}`,
          description: `Mensalidade: ${player?.name?.toUpperCase() || 'ATLETA'}`,
          value: p.value,
          date: p.month,
          type: 'payment' as const,
          category: 'Entrada',
          sortDate
        };
      });

    const eItems = expenses.map(e => ({
      ...e,
      type: 'expense' as const,
      sortDate: new Date(e.date + 'T00:00:00').getTime()
    }));

    return [...pItems, ...eItems].sort((a, b) => b.sortDate - a.sortDate);
  }, [expenses, payments, players]);

  return (
    <div className="space-y-6">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight uppercase">Caixa <span className="text-[#F4BE02]">100Firula</span></h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Gestão Financeira</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('history')}
              className={`p-3 rounded-2xl border transition-all ${activeTab === 'history' ? 'bg-[#F4BE02] border-[#F4BE02] text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
            >
              <History size={20} />
            </button>
        </div>
      </div>

      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-3 gap-1">
        <TabButton 
            active={activeTab === 'payments'} 
            onClick={() => setActiveTab('payments')} 
            icon={<Banknote size={14} />} 
            label="Mensal." 
        />
        <TabButton 
            active={activeTab === 'expenses'} 
            onClick={() => setActiveTab('expenses')} 
            icon={<Receipt size={14} />} 
            label="Saídas" 
        />
        <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
            icon={<BarChart3 size={14} />} 
            label="Análise" 
        />
      </div>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/[0.08] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F4BE02]/5 rounded-full blur-[60px]"></div>
          <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#F4BE02]/10 rounded-xl flex items-center justify-center text-[#F4BE02]">
                  <Wallet size={20} />
              </div>
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Saldo Geral Acumulado</span>
                  <span className={`text-[10px] font-bold ${globalBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {globalBalance >= 0 ? 'Positivo' : 'Abaixo do esperado'}
                  </span>
              </div>
          </div>
          <h2 className={`text-5xl font-display font-bold tracking-tighter ${globalBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
              <span className="text-lg font-bold text-[#F4BE02] mr-1">R$</span>{Math.abs(globalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-6 border-t border-white/5">
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-green-500 mb-1">
                      <TrendingUp size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Receitas</span>
                  </div>
                  <span className="font-bold text-lg">R$ {totalRevenue.toFixed(0)}</span>
              </div>
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-red-500 mb-1">
                      <TrendingDown size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Despesas</span>
                  </div>
                  <span className="font-bold text-lg">R$ {totalExpenses.toFixed(0)}</span>
              </div>
          </div>
          </div>
      </div>

      {/* Period Selector with fixed layout */}
      <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#F4BE02]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Seletor de Período</span>
          </div>
        </div>
        <div className="flex gap-2">
          <select 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white outline-none focus:border-[#F4BE02]/50 transition-all active:scale-[0.98] appearance-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map(m => <option key={m} value={m} className="bg-black text-white">{m.toUpperCase()}</option>)}
          </select>
          <select 
            className="w-28 bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white outline-none focus:border-[#F4BE02]/50 transition-all active:scale-[0.98] appearance-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y} value={y} className="bg-black text-white">{y}</option>)}
          </select>
        </div>
      </div>

      {activeTab === 'payments' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-1 flex justify-between items-end">
              <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Controle de Mensalidades</h3>
                  <p className="text-[9px] text-white/20 mt-1 uppercase font-black">{selectedPeriod.toUpperCase()}</p>
              </div>
              <div className="text-right">
                  <span className="text-[10px] font-black text-[#F4BE02]">{progress.toFixed(0)}%</span>
                  <div className="h-1.5 w-20 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#F4BE02] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
              </div>
            </div>
            
            <div className="space-y-3 pb-32">
              {activePlayers.length > 0 ? activePlayers.map(player => {
                const payment = payments.find(p => p.playerId === player.id && normalizePeriod(p.month) === normalizePeriod(selectedPeriod));
                const isPaid = payment?.status === 'Pago';
                const pValue = payment?.value ?? 50;

                return (
                  <div key={player.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm border ${isPaid ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/20'}`}>
                          {player.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-tight uppercase truncate max-w-[120px]">{player.name}</h4>
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{player.position}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePayment(player.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-white/40 border border-white/5'}`}
                      >
                        {isPaid ? 'PAGO' : 'PENDENTE'}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                      <div className="flex items-center gap-2 text-white/30">
                        <DollarSign size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Valor:</span>
                      </div>
                      <input 
                        type="number" 
                        value={pValue}
                        onChange={(e) => updatePaymentValue(player.id, e.target.value)}
                        className="bg-transparent flex-1 text-right font-display font-bold text-sm text-[#F4BE02] outline-none"
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 opacity-20 flex flex-col items-center">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum atleta ativo no elenco</p>
                </div>
              )}
            </div>
          </section>
      )}

      {activeTab === 'expenses' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32">
              {!showExpenseForm ? (
                  <button 
                    onClick={() => {
                        resetExpenseForm();
                        setShowExpenseForm(true);
                    }}
                    className="w-full bg-white/[0.03] border border-dashed border-white/20 hover:border-[#F4BE02] hover:bg-[#F4BE02]/5 text-white/40 hover:text-[#F4BE02] p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all group"
                  >
                    <Plus size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Novo Lançamento</span>
                  </button>
              ) : (
                  <div className="bg-[#0A0A0A] p-5 rounded-[24px] border border-white/10 space-y-4 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm text-white uppercase">{editingExpense ? 'Editar Saída' : 'Nova Despesa'}</h4>
                          <button onClick={resetExpenseForm} className="text-white/40 hover:text-white text-xs font-bold uppercase">Cancelar</button>
                      </div>
                      <div className="space-y-4">
                          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                              <Receipt size={16} className="text-white/30" />
                              <input type="text" placeholder="DESCRIÇÃO" className="bg-transparent w-full outline-none text-sm font-bold placeholder:text-white/20 uppercase" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value.toUpperCase())} />
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => setNewExpenseType('Fixa')} 
                              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${newExpenseType === 'Fixa' ? 'bg-[#F4BE02] text-black border-[#F4BE02]' : 'bg-white/5 text-white/40 border-white/5'}`}
                            >
                              Fixa
                            </button>
                            <button 
                              onClick={() => setNewExpenseType('Variável')} 
                              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${newExpenseType === 'Variável' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
                            >
                              Variável
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                                  <span className="text-white/30 font-bold text-sm uppercase">R$</span>
                                  <input type="number" placeholder="0.00" className="bg-transparent w-full outline-none text-sm font-bold placeholder:text-white/20" value={newExpenseValue} onChange={e => setNewExpenseValue(e.target.value)} />
                              </div>
                              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                                  <Calendar size={16} className="text-white/30" />
                                  <input type="date" className="bg-transparent w-full outline-none text-[10px] font-bold text-white/70" value={newExpenseDate} onChange={e => setNewExpenseDate(e.target.value)} />
                              </div>
                          </div>
                          <button onClick={handleSaveExpense} disabled={!newExpenseDesc || !newExpenseValue} className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                            {editingExpense ? 'Salvar Alterações' : 'Confirmar Saída'}
                          </button>
                      </div>
                  </div>
              )}
              <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Saídas Filtradas: {selectedPeriod.toUpperCase()}</h3>
                  </div>
                  {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                      <div key={expense.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex items-center justify-between group transition-all hover:border-white/10">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${expense.category === 'Fixa' ? 'bg-[#F4BE02]/10 border-[#F4BE02]/20 text-[#F4BE02]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                {expense.category === 'Fixa' ? <Layers size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div className="max-w-[120px]">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-white truncate uppercase">{expense.description}</h4>
                                  </div>
                                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">{new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white/[0.02] px-2 py-1 rounded-lg border border-white/5 focus-within:border-red-500/30">
                              <span className="text-[10px] font-bold text-red-500/50 uppercase">R$</span>
                              <input 
                                type="number"
                                value={expense.value}
                                onChange={(e) => updateExpenseValue(expense.id, e.target.value)}
                                className="w-16 bg-transparent text-right font-display font-bold text-base text-red-500 outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => handleEditExpense(expense)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                                    <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center py-10 opacity-20 flex flex-col items-center">
                        <Receipt size={32} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma despesa para este período</p>
                      </div>
                  )}
              </div>
          </section>
      )}

      {activeTab === 'analysis' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-display font-bold uppercase">Resumo Mensal</h3>
                        <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-widest">{selectedPeriod.toUpperCase()}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${periodBalance >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        <PieChart size={24} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <AnalysisSummaryItem 
                        icon={<ArrowUpCircle size={18} className="text-green-500" />} 
                        label="Entradas (Mensalidades)" 
                        value={periodRevenueTotal} 
                        color="text-green-500"
                    />
                    <AnalysisSummaryItem 
                        icon={<ArrowDownCircle size={18} className="text-red-500" />} 
                        label="Saídas (Despesas)" 
                        value={periodExpensesTotal} 
                        color="text-red-500"
                    />
                    <div className="h-[1px] bg-white/5 my-1"></div>
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Saldo do Período</span>
                        <span className={`font-display font-bold text-xl uppercase ${periodBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
                            {periodBalance < 0 ? '-' : '+'} R$ {Math.abs(periodBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={14} className="text-green-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Receitas Detalhadas</h3>
                </div>
                <div className="bg-[#0A0A0A] rounded-[24px] border border-white/[0.06] divide-y divide-white/[0.03]">
                    {periodRevenueItems.length > 0 ? periodRevenueItems.map(item => {
                        const player = players.find(p => p.id === item.playerId);
                        return (
                            <div key={item.playerId} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs uppercase">
                                        {player?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs font-bold text-white/80 uppercase truncate max-w-[150px]">{player?.name || 'ATLETA'}</span>
                                </div>
                                <span className="text-sm font-display font-bold text-green-500">R$ {item.value.toFixed(2)}</span>
                            </div>
                        );
                    }) : (
                        <div className="p-10 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">Sem receitas no período</div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <TrendingDown size={14} className="text-red-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Despesas Detalhadas</h3>
                </div>
                <div className="bg-[#0A0A0A] rounded-[24px] border border-white/[0.06] divide-y divide-white/[0.03]">
                    {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                        <div key={expense.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${expense.category === 'Fixa' ? 'bg-[#F4BE02]/10 text-[#F4BE02]' : 'bg-red-500/10 text-red-500'}`}>
                                    {expense.category === 'Fixa' ? 'F' : 'V'}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white/80 uppercase truncate max-w-[150px]">{expense.description}</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{expense.category?.toUpperCase()}</p>
                                </div>
                            </div>
                            <span className="text-sm font-display font-bold text-red-500">R$ {expense.value.toFixed(2)}</span>
                        </div>
                    )) : (
                        <div className="p-10 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">Sem despesas no período</div>
                    )}
                </div>
            </div>
          </section>
      )}

      {activeTab === 'history' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
          <div className="px-1 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Histórico Unificado</h3>
              <p className="text-[9px] text-white/20 mt-1 uppercase font-black tracking-widest">REGISTRO GERAL DE MOVIMENTAÇÕES</p>
            </div>
            <button onClick={() => setActiveTab('payments')} className="text-[#F4BE02] text-[10px] font-black uppercase tracking-widest">Voltar</button>
          </div>
          <div className="space-y-3">
            {historyItems.length > 0 ? historyItems.map((item, idx) => (
              <div key={item.id + idx} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.type === 'payment' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {item.type === 'payment' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="max-w-[180px]">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate uppercase">{item.description}</h4>
                      <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded ${item.type === 'payment' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.type === 'payment' ? 'ENTRADA' : item.category?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">{item.date.toUpperCase()}</span>
                  </div>
                </div>
                <span className={`font-display font-bold text-base ${item.type === 'payment' ? 'text-green-500' : 'text-red-500'}`}>
                  {item.type === 'payment' ? '+' : '-'} R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20 flex flex-col items-center">
                <History size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma transação registrada</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/10' : 'text-white/30 hover:bg-white/5'}`}
  >
    {icon} {label}
  </button>
);

const AnalysisSummaryItem = ({ icon, label, value, color }: any) => (
  <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/5">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
    </div>
    <span className={`font-display font-bold text-lg ${color}`}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
  </div>
);

export default Finance;
